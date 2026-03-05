
// import { db, collection, addDoc, query, orderBy, limit, getDocs, deleteDoc, doc} from "./firebase.js";
import { db } from "./firebase.js";

import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  deleteDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// janela "tente novamente"
const gameoveraudio = new Audio("./audio/gameover.mp3");
// gameoveraudio.play();

// quando não consegue encontrar o par
const noparaudio = new Audio("./audio/nopar.mp3");
// noparaudio.play();

// quando consegue encontrar o par
const paraudio = new Audio("./audio/par.mp3");
// paraudio.play();

//quando consegue entrar no top 10
const winaudio = new Audio("./audio/win.mp3");
// winaudio.play();

// Alterar ícone do menu e abrir a janela ao clicar
const buttonMenu = document.getElementById('menu_icon');
const menuList = document.getElementById('menu-list');
buttonMenu.addEventListener('click', () => {
    if(buttonMenu.classList.contains('fa-bars')){
        buttonMenu.classList.remove('fa-bars');
        buttonMenu.classList.add('fa-xmark');
        menuList.classList.add('open');
        return;
    }
    buttonMenu.classList.remove('fa-xmark');
    buttonMenu.classList.add('fa-bars');
    menuList.classList.remove('open');
});

// Alterar ícone de definir cor de fundo e alterar a cor ao clicar
const mode = document.getElementById('mode_icon');
const backBlack = document.getElementById('fundo1');
mode.addEventListener('click', () => {
    if(mode.classList.contains('fa-sun')){
        mode.classList.remove('fa-sun');
        mode.classList.add('fa-moon');
        backBlack.classList.add('fundoBlack');
        return;
    }
    mode.classList.remove('fa-moon');
    mode.classList.add('fa-sun');
    backBlack.classList.remove('fundoBlack');
});

//--------------------------------------------
mostrarMelhorTempo();

const game = document.getElementById("game");

let firstCard = null;
let lockBoard = false;
let matches = 0;
let timerInterval = null;

// ⏱ Controle do tempo
let startTime = null;
let timerStarted = false;
let finalTime = 0;

//  iniciar
function startGame() {
    game.innerHTML = "";
    firstCard = null;
    lockBoard = false;
    matches = 0;
    // reset cronômetro
    startTime = null;
    timerStarted = false;
    finalTime = 0;
    document.getElementById("victory").classList.remove("show");
    document.getElementById("victory").classList.add("hidden");
    const totalPairs = 12; // altere aqui se quiser
    //===========================================
    let images = [];
    for (let i = 1; i <= totalPairs; i++) {
        images.push(`img/${i}.png`);
    }
    const cardsArray = [...images, ...images];
    cardsArray.sort(() => Math.random() - 0.5);
    cardsArray.forEach(src => {
        const card = document.createElement("div");
        card.classList.add("card");
        card.innerHTML = `
            <div class="card-inner">
                <div class="card-front">?</div>
                <div class="card-back">
                    <img src="${src}">
                </div>
            </div>
        `;   
        card.addEventListener("click", () => flipCard(card));
        game.appendChild(card);
        clearInterval(timerInterval);
        document.getElementById("timer").textContent = "⏱ 00:00:00";
    });
}

//virar a carta clicada //impede clicar em uma carta já virada
//marca a primeira e a segunda carta //chama verificação de par
function flipCard(card) {
    if (lockBoard || card.classList.contains("flip") ||  card.classList.contains("matched")) return;
    // ⏱ inicia cronômetro na primeira carta
    if (!timerStarted) {
        startTime = Date.now();
        timerStarted = true;
        timerInterval = setInterval(updateTimer, 10); // atualiza a cada 10ms
    }
    card.classList.add("flip");
    if (!firstCard) {
        firstCard = card;
        return;
    }
    const img1 = firstCard.querySelector("img").src;
    const img2 = card.querySelector("img").src;
    if (img1 === img2) {
        matches++;
        firstCard.classList.add("matched");
        card.classList.add("matched");
        firstCard = null;
        const totalPairs = document.querySelectorAll(".card").length / 2;
        if (matches === totalPairs) {
            endGame();
        }else{
            paraudio.play(); //audio
        }
    } else {
        lockBoard = true;
        setTimeout(() => {
            firstCard.classList.remove("flip");
            card.classList.remove("flip");
            firstCard = null;
            lockBoard = false;
           //noparaudio.play(); //audio
        }, 1000);
    }
}

async function podeEntrarNoRanking(tempoFinal) {
    const rankingRef = collection(db, "ranking");
    const q = query(rankingRef, orderBy("tempo", "asc"), limit(10));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;
    if (docs.length < 10) {
        return true;
    }
    const piorTempo = docs[docs.length - 1].data().tempo;
    return tempoFinal < piorTempo;
}


// pegar o tempo do 10° colocado
async function pegarPiorTempoTop10() {
    const rankingRef = collection(db, "ranking");
    const q = query(rankingRef, orderBy("tempo", "asc"), limit(10));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    if (docs.length < 10) {
        return null; // ainda não tem 10 jogadores
    }

    const piorTempo = docs[docs.length - 1].data().tempo;
    return piorTempo;
}

// quando todos os pares são encontrados
// calcula tempo final // para o conômetro // verficar tempo record // mostra tela de vitória
async function endGame() {
    finalTime = Date.now() - startTime;
    updateTimer(); // força atualização final na <p>
    clearInterval(timerInterval);
    verificarMelhorTempo(finalTime);
    const podeEntrar = await podeEntrarNoRanking(finalTime);
    if (podeEntrar) {
        document.getElementById("nicknameModal").style.display = "flex";
        document.getElementById("textoInfo").textContent = "Seu tempo: " + formatarTempo(parseInt(finalTime));
        const posicao = await calcularPosicaoRanking(finalTime);
        document.getElementById("rankingPreview").textContent = "Parabéns! Você ficou em " + posicao + "° lugar no top 10. Digite seu nome ou um nick a sua escolha para ficar registrado.";
        winaudio.play(); // audio
    }else{
        const piorTempo = await pegarPiorTempoTop10();
        showVictory(piorTempo);
        gameoveraudio.play(); //audio
    }
}

function showVictory(piorTempo = null) {
    const victory = document.getElementById("victory");

    const tempoAtualFormatado = formatarTempo(finalTime);

    let mensagem = `🕔 Seu tempo atual: ${tempoAtualFormatado} <br>`;

    if (piorTempo !== null) {
        mensagem += `
        <br>
        ⚠️ O tempo deve ser abaixo de:  
        <span>${formatarTempo(piorTempo)}</span>
        `;
    }

    victory.querySelector("h2").innerHTML = mensagem;

    victory.classList.remove("hidden");
    setTimeout(() => {
        victory.classList.add("show");
    }, 10);
}

// converte milissegundos 
function formatarTempo(ms) {
    const minutos = Math.floor(ms / 60000);
    const segundos = Math.floor((ms % 60000) / 1000);
    const centesimos = Math.floor((ms % 1000) / 10);

    return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}:${String(centesimos).padStart(2, "0")}`;
}

 // exibe o melhor tempo salvo no localStorage
function mostrarMelhorTempo() {
    const bestTime = localStorage.getItem("bestTime");
    const elemento = document.getElementById("bestTime");
    if (bestTime) {
        elemento.textContent = formatarTempo(parseInt(bestTime));
    } else {
        elemento.textContent = "00:00:00";
    }
}

// compara o tempo atual com o salvo no navegador
function verificarMelhorTempo(tempoAtual) {
    const bestTimeSalvo = localStorage.getItem("bestTime");
    if (!bestTimeSalvo || tempoAtual < parseInt(bestTimeSalvo)) {
        localStorage.setItem("bestTime", tempoAtual);
    }
    mostrarMelhorTempo();
}
// ------------------------------------
// atualiza o tempo do conômetro na tela
function updateTimer() {
    const currentTime = Date.now() - startTime;
    const minutes = Math.floor(currentTime / 60000);
    const seconds = Math.floor((currentTime % 60000) / 1000);
    const hundredths = Math.floor((currentTime % 1000) / 10);
    const formattedTime =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0") + ":" +
        String(hundredths).padStart(2, "0");
    document.getElementById("timer").textContent = "⏱ " + formattedTime;
}

//
async function salvarNoRanking(nickname, tempoFinal) {
    try {
        const rankingRef = collection(db, "ranking");
        const q = query(rankingRef, orderBy("tempo", "asc"), limit(10));
        const snapshot = await getDocs(q);
        const docs = snapshot.docs;
        if (docs.length < 10) {
            await addDoc(rankingRef, {
                nome: nickname,
                tempo: tempoFinal,
                data: new Date()
            });
            await carregarRanking();
            return true;
        } else {
            const piorDoc = docs[docs.length - 1];
            const piorTempo = piorDoc.data().tempo;
            if (tempoFinal < piorTempo) {
                //
                await addDoc(rankingRef, {
                    nome: nickname,
                    tempo: tempoFinal,
                    data: new Date()
                });
                await deleteDoc(doc(db, "ranking", piorDoc.id));
                await carregarRanking();
                return true;
            } else {
                return false;
            }
        }
    } catch (error) {
        console.error("Erro ao salvar:", error);
        return false;
    }
}

//////////////////////////////////////
async function calcularPosicaoRanking(tempoFinal) {
    const rankingRef = collection(db, "ranking");
    const q = query(rankingRef, orderBy("tempo", "asc"), limit(10));
    const snapshot = await getDocs(q);
    const docs = snapshot.docs;

    let posicao = 1;

    for (let docItem of docs) {
        const tempo = docItem.data().tempo;
        if (tempoFinal < tempo) {
            return posicao;
        }
        posicao++;
    }
    // Se ainda não tiver 10 jogadores
    if (docs.length < 10) {
        return docs.length + 1;
    }
    // Se não entrar
    return null;
}

carregarRanking();

//carregar o top 10
async function carregarRanking() {
    const rankingRef = collection(db, "ranking");
    const q = query(rankingRef, orderBy("tempo"), limit(10));
    const querySnapshot = await getDocs(q);
    const rankingList = document.getElementById("rankingList");
    rankingList.innerHTML = "";
    //   -------
    let posicao = 1; 
    querySnapshot.forEach((doc) => {
    const data = doc.data();
        const item = document.createElement("div");
        item.classList.add("ranking-item");
        item.innerHTML = `
            <span class="ranking-pos">${posicao}º</span>
            <span class="ranking-nome">${data.nome}</span>
            <span class="ranking-tempo">${formatarTempo(data.tempo)}</span>
        `;
        rankingList.appendChild(item);
        posicao++;
    });
}

// abir ou fechar top 10
const btnRanking = document.getElementById("btnRanking");
const ranking = document.getElementById("rankingOn");

btnRanking.addEventListener("click", () => {

    if (ranking.style.display === "none" || ranking.style.display === "") {
        ranking.style.display = "flex";
        buttonMenu.classList.remove('fa-xmark');
    buttonMenu.classList.add('fa-bars');
        menuList.classList.remove('open');
     } else {
         ranking.style.display = "none";
     }

});

// fechar ranking ao clicar no X
const btnRankingOff = document.getElementById("closedRanking");
const rankingOff = document.getElementById("rankingOn");

btnRankingOff.addEventListener("click", () => {

    if (rankingOff.style.display === "flex") {
        rankingOff.style.display = "none";
     } else {
        rankingOff.style.display = "flex";
     }
});

// abrir janela do seu melhor tempo
const btnMelhorT = document.getElementById("btnMelhorTempo");
const MDI = document.getElementById("melhorTempoIndividual");
btnMelhorT.addEventListener("click", () => {
    if (MDI.style.display === "none" || MDI.style.display === "") {
        MDI.style.display = "flex";
        buttonMenu.classList.remove('fa-xmark');
        buttonMenu.classList.add('fa-bars');
        menuList.classList.remove('open');
     } else {
         MDI.style.display = "none";
     }
});

// fechar janela do seu melhor tempo
const btnMelhorTOff = document.getElementById("closeMDI");
const MDIOff = document.getElementById("melhorTempoIndividual");

btnMelhorTOff.addEventListener("click", () => {

    if (MDIOff.style.display === "flex") {
        MDIOff.style.display = "none";
     } else {
        MDIOff.style.display = "flex";
     }
});

// abrir janela sobre o game
const abrirJanelaSobreBtn = document.getElementById('abrirJanelaSobre');
const fundoJanelaSobreId = document.getElementById('sobreFundo');
abrirJanelaSobreBtn.addEventListener('click', ()=>{
    fundoJanelaSobreId.style.display = "flex";
    buttonMenu.classList.remove('fa-xmark');
    buttonMenu.classList.add('fa-bars');
    menuList.classList.remove('open');
});

// fechar janela sobre o game
const fecharJanelaSobreBtn = document.getElementById('closedSobre');
fecharJanelaSobreBtn.addEventListener('click', ()=>{
    fundoJanelaSobreId.style.display = "none";
});

// btnMelhorTempo melhorTempoIndividual

// botão salvar
// document.getElementById("saveScoreBtn").addEventListener("click", () => {
document.getElementById("saveScoreBtn").addEventListener("click", async () => {
    const nickname = document.getElementById("nicknameInput").value.trim();
    if (nickname.length < 3) {
        alert("Digite pelo menos 3 caracteres");
        return;
    }
    //   salvarNoRanking(nickname, finalTime);
    const entrou = await salvarNoRanking(nickname, finalTime);
    if (entrou) {
        // alert("🎉 Você entrou no Top 10!");
        ranking.style.display = "flex"; //abrir top 10
    } else {
        // alert("😢 Seu tempo não entrou no ranking.");
    }
    document.getElementById("nicknameModal").style.display = "none";
    startGame();
});

// reniciar jogo e fechar o menu
document.getElementById("btnReiniciar").addEventListener("click", () => {
    startGame();
    buttonMenu.classList.remove('fa-xmark');
    buttonMenu.classList.add('fa-bars');
    menuList.classList.remove('open');
});

document.getElementById("btnReiniciarVictory").addEventListener("click", startGame);

carregarRanking();

startGame();






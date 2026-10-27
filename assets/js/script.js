/* =========================================================
   PROGRESSIVE — Dados e persistência
   Entidade principal: exercício da biblioteca.
   Os exercícios ficam salvos no localStorage do navegador.
   ========================================================= */

const CHAVE_EXERCICIOS = 'progressive.exercicios';

/* Rótulos exibidos na interface para os valores salvos */
const GRUPOS = {
    peitoral: 'Peitoral',
    costas: 'Costas',
    pernas: 'Pernas',
    ombros: 'Ombros',
    biceps: 'Bíceps',
    triceps: 'Tríceps',
    core: 'Core / Abdômen'
};

const EQUIPAMENTOS = {
    barra: 'Barra',
    halter: 'Halteres',
    maquina: 'Máquina',
    polia: 'Polia / Cabo',
    'peso-corporal': 'Peso Corporal'
};

const TIPOS = {
    composto: 'Composto (multiarticular)',
    isolador: 'Isolador (monoarticular)'
};

/* Exercícios usados na primeira visita, quando o localStorage ainda está vazio */
const EXERCICIOS_INICIAIS = [
    {
        id: 'ex-supino-reto',
        nome: 'Supino Reto com Barra',
        grupo: 'peitoral',
        equipamento: 'barra',
        tipo: 'composto',
        carga: 100,
        instrucoes: 'Deite no banco com os olhos alinhados à barra e os pés firmes no chão.\n'
            + 'Segure a barra um pouco mais aberto que os ombros e retraia as escápulas.\n'
            + 'Desça a barra controlada até tocar o meio do peito.\n'
            + 'Empurre de volta até estender os braços, sem tirar o quadril do banco.',
        historico: [
            { data: '2026-09-20', carga: 95 },
            { data: '2026-09-27', carga: 97.5 },
            { data: '2026-10-04', carga: 100 }
        ],
        imagem: '../assets/img/supino_reto-capa.jpg',
        video: '../assets/video/supino_reto.mp4',
        origem: 'manual',
        criadoEm: '2026-09-01T10:00:00.000Z'
    },
    {
        id: 'ex-agachamento-livre',
        nome: 'Agachamento Livre',
        grupo: 'pernas',
        equipamento: 'barra',
        tipo: 'composto',
        carga: 130,
        instrucoes: 'Apoie a barra no trapézio e afaste os pés na largura dos ombros.\n'
            + 'Inspire, contraia o abdômen e desça empurrando o quadril para trás.\n'
            + 'Desça até as coxas ficarem pelo menos paralelas ao chão.\n'
            + 'Suba empurrando o chão, mantendo os joelhos alinhados com os pés.',
        historico: [
            { data: '2026-09-22', carga: 125 },
            { data: '2026-10-06', carga: 127.5 },
            { data: '2026-10-20', carga: 130 }
        ],
        imagem: null,
        origem: 'manual',
        criadoEm: '2026-09-02T10:00:00.000Z'
    },
    {
        id: 'ex-levantamento-terra',
        nome: 'Levantamento Terra',
        grupo: 'costas',
        equipamento: 'barra',
        tipo: 'composto',
        carga: 150,
        instrucoes: 'Posicione a barra sobre o meio dos pés, com as canelas próximas a ela.\n'
            + 'Segure a barra com os braços estendidos e as costas neutras.\n'
            + 'Empurre o chão com as pernas e estenda o quadril ao mesmo tempo.\n'
            + 'Desça a barra rente às pernas, controlando o movimento.',
        historico: [
            { data: '2026-09-29', carga: 150 },
            { data: '2026-10-06', carga: 150 },
            { data: '2026-10-13', carga: 150 }
        ],
        imagem: null,
        origem: 'manual',
        criadoEm: '2026-09-03T10:00:00.000Z'
    },
    {
        id: 'ex-desenvolvimento-halteres',
        nome: 'Desenvolvimento c/ Halteres',
        grupo: 'ombros',
        equipamento: 'halter',
        tipo: 'composto',
        carga: 32,
        instrucoes: 'Sente com as costas apoiadas e os halteres na altura dos ombros.\n'
            + 'Empurre os halteres para cima até quase encostarem no topo.\n'
            + 'Desça devagar até os cotovelos ficarem um pouco abaixo dos ombros.',
        historico: [
            { data: '2026-10-01', carga: 34 },
            { data: '2026-10-15', carga: 32 }
        ],
        imagem: null,
        origem: 'manual',
        criadoEm: '2026-09-04T10:00:00.000Z'
    }
];

/* ---------- localStorage ---------- */

function carregarExercicios() {
    try {
        const salvo = localStorage.getItem(CHAVE_EXERCICIOS);
        if (salvo === null) {
            // Primeira visita: grava os exercícios iniciais
            const iniciais = structuredClone(EXERCICIOS_INICIAIS);
            salvarExercicios(iniciais);
            return iniciais;
        }
        const lista = JSON.parse(salvo);
        if (!Array.isArray(lista)) {
            return [];
        }
        if (migrarDados(lista)) {
            salvarExercicios(lista);
        }
        return lista;
    } catch (erro) {
        // localStorage bloqueado ou conteúdo corrompido: segue só com os iniciais
        console.warn('Não foi possível ler o localStorage:', erro);
        return structuredClone(EXERCICIOS_INICIAIS);
    }
}

/* Atualiza dados salvos por versões antigas do site.
   O GIF do supino (5,6 MB) foi trocado por um vídeo MP4 (90 KB) com imagem de capa. */
function migrarDados(lista) {
    let mudou = false;
    for (const exercicio of lista) {
        if (exercicio.imagem === '../assets/img/supino_reto.gif') {
            exercicio.imagem = '../assets/img/supino_reto-capa.jpg';
            exercicio.video = '../assets/video/supino_reto.mp4';
            mudou = true;
        }
    }
    return mudou;
}

function salvarExercicios(lista) {
    try {
        localStorage.setItem(CHAVE_EXERCICIOS, JSON.stringify(lista));
        return true;
    } catch (erro) {
        console.warn('Não foi possível salvar no localStorage:', erro);
        return false;
    }
}

function buscarExercicioPorId(lista, id) {
    return lista.find((exercicio) => exercicio.id === id) || null;
}

function gerarId() {
    return 'ex-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ---------- Utilidades de texto, números e datas ---------- */

/* Minúsculas e sem acento: "Agachamento" e "agachámento" viram o mesmo texto */
function normalizarTexto(texto) {
    return String(texto || '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();
}

function formatarCarga(carga) {
    if (carga === null || carga === undefined) {
        return 'Sem registro';
    }
    return carga.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + ' kg';
}

function formatarData(dataIso) {
    const [ano, mes, dia] = dataIso.slice(0, 10).split('-');
    return `${dia}/${mes}/${ano}`;
}

function hojeIso() {
    const agora = new Date();
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const dia = String(agora.getDate()).padStart(2, '0');
    return `${agora.getFullYear()}-${mes}-${dia}`;
}

/* Compara os dois últimos registros do histórico para mostrar a progressão */
function calcularTendencia(exercicio) {
    const historico = exercicio.historico || [];
    if (historico.length === 0) {
        return { tipo: 'flat', texto: '• Sem carga registrada' };
    }
    if (historico.length === 1) {
        return { tipo: 'flat', texto: '• Primeiro registro' };
    }

    const ultimo = historico[historico.length - 1].carga;
    const anterior = historico[historico.length - 2].carga;
    const diferenca = ultimo - anterior;

    if (diferenca > 0) {
        return { tipo: 'up', texto: `↑ +${formatarCarga(diferenca)} desde o último registro` };
    }
    if (diferenca < 0) {
        return { tipo: 'down', texto: `↓ −${formatarCarga(Math.abs(diferenca))} (deload)` };
    }
    return { tipo: 'flat', texto: '→ Carga mantida' };
}

/* Instruções são salvas como texto; cada linha vira um passo */
function separarPassos(instrucoes) {
    return String(instrucoes || '')
        .split('\n')
        .map((passo) => passo.trim())
        .filter((passo) => passo.length > 0);
}

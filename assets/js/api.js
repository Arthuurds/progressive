/* =========================================================
   PROGRESSIVE — Integração com a API pública wger
   https://wger.de/api/v2/  (dados de exercícios, licença CC-BY-SA)

   Fluxo: pesquisar na wger -> escolher um resultado ->
          cadastrar na biblioteca -> salvar no localStorage.
   Depende de script.js (dados) e biblioteca.js (cadastro e lista).
   ========================================================= */

const WGER_URL = 'https://wger.de/api/v2/exerciseinfo/';
const WGER_IDIOMA_PT = 7;
const WGER_IDIOMA_EN = 2;
const WGER_LIMITE = 12;
const WGER_TEMPO_LIMITE = 12000; // ms

/* Categorias da wger -> grupos musculares do Progressive ("Arms" é tratado à parte) */
const CATEGORIA_PARA_GRUPO = {
    Abs: 'core',
    Back: 'costas',
    Calves: 'pernas',
    Cardio: 'pernas',
    Chest: 'peitoral',
    Legs: 'pernas',
    Shoulders: 'ombros'
};

/* Equipamentos da wger -> equipamentos do Progressive (banco é só apoio e fica de fora) */
const EQUIPAMENTO_WGER = {
    Barbell: 'barra',
    'SZ-Bar': 'barra',
    Dumbbell: 'halter',
    Kettlebell: 'halter',
    'Cable machine': 'polia',
    'Resistance band': 'polia',
    'Pull-up bar': 'peso-corporal',
    'Gym mat': 'peso-corporal',
    'Swiss Ball': 'peso-corporal',
    'none (bodyweight exercise)': 'peso-corporal'
};

/* Nomes dos músculos da wger em português */
const MUSCULOS_PT = {
    Shoulders: 'Ombros',
    Biceps: 'Bíceps',
    Hamstrings: 'Posteriores da coxa',
    Brachialis: 'Braquial',
    Calves: 'Panturrilhas',
    Glutes: 'Glúteos',
    Lats: 'Dorsais',
    'Obliquus externus abdominis': 'Oblíquos',
    Chest: 'Peitoral',
    Quads: 'Quadríceps',
    Abs: 'Abdômen',
    'Serratus anterior': 'Serrátil',
    Soleus: 'Sóleo',
    Trapezius: 'Trapézio',
    Triceps: 'Tríceps'
};

const formApiEl = document.getElementById('form-api');
const buscaApiEl = document.getElementById('busca-api');
const botaoBuscarApiEl = document.getElementById('btn-buscar-api');
const statusApiEl = document.getElementById('status-api');
const resultadosApiEl = document.getElementById('resultados-api');

/* Resultados da última busca, já convertidos para o formato do Progressive */
let resultadosWger = [];

/* ---------- Conversão dos dados da wger ---------- */

function nomeDoMusculo(musculo) {
    return musculo.name_en || musculo.name || '';
}

/* Prefere a tradução em português; se não houver, usa a em inglês */
function traducaoPreferida(exercicioWger) {
    const traducoes = exercicioWger.translations || [];
    return traducoes.find((t) => t.language === WGER_IDIOMA_PT)
        || traducoes.find((t) => t.language === WGER_IDIOMA_EN)
        || null;
}

function grupoDoWger(exercicioWger) {
    const categoria = exercicioWger.category ? exercicioWger.category.name : '';
    if (categoria === 'Arms') {
        const musculos = (exercicioWger.muscles || []).map(nomeDoMusculo);
        return musculos.includes('Triceps') ? 'triceps' : 'biceps';
    }
    return CATEGORIA_PARA_GRUPO[categoria] || 'core';
}

function equipamentoDoWger(exercicioWger) {
    for (const equipamento of exercicioWger.equipment || []) {
        if (EQUIPAMENTO_WGER[equipamento.name]) {
            return EQUIPAMENTO_WGER[equipamento.name];
        }
    }
    return 'maquina';
}

/* Um músculo principal e nenhum secundário indica exercício isolador */
function tipoDoWger(exercicioWger) {
    const principais = (exercicioWger.muscles || []).length;
    const secundarios = (exercicioWger.muscles_secondary || []).length;
    return principais === 1 && secundarios === 0 ? 'isolador' : 'composto';
}

/* A descrição vem em HTML; vira texto puro com uma frase por linha (um passo) */
function instrucoesDoWger(traducao) {
    if (!traducao || !traducao.description) {
        return '';
    }
    const documento = new DOMParser().parseFromString(traducao.description, 'text/html');
    const texto = (documento.body.textContent || '').replace(/\s+/g, ' ').trim();
    const frases = texto.split(/(?<=[.!?])\s+/).filter((frase) => frase.length > 2);
    return frases.slice(0, 8).join('\n').slice(0, 1000);
}

function imagemDoWger(exercicioWger) {
    const imagens = exercicioWger.images || [];
    const principal = imagens.find((imagem) => imagem.is_main) || imagens[0];
    return principal ? principal.image : null;
}

function converterExercicioWger(exercicioWger) {
    const traducao = traducaoPreferida(exercicioWger);
    if (!traducao || !traducao.name) {
        return null;
    }
    return {
        wgerId: exercicioWger.id,
        nome: traducao.name.trim().slice(0, 60),
        grupo: grupoDoWger(exercicioWger),
        equipamento: equipamentoDoWger(exercicioWger),
        tipo: tipoDoWger(exercicioWger),
        instrucoes: instrucoesDoWger(traducao),
        imagem: imagemDoWger(exercicioWger),
        musculos: (exercicioWger.muscles || [])
            .map(nomeDoMusculo)
            .filter(Boolean)
            .map((musculo) => MUSCULOS_PT[musculo] || musculo)
    };
}

/* ---------- Requisição ---------- */

async function buscarNaWger(termo) {
    const url = `${WGER_URL}?name__search=${encodeURIComponent(termo)}&limit=${WGER_LIMITE}`;

    // Cancela a requisição se a API demorar demais
    const controle = new AbortController();
    const temporizador = setTimeout(() => controle.abort(), WGER_TEMPO_LIMITE);

    try {
        const resposta = await fetch(url, { signal: controle.signal });
        if (!resposta.ok) {
            throw new Error(`A wger respondeu com status ${resposta.status}.`);
        }
        const dados = await resposta.json();

        // Converte e remove nomes repetidos (a wger tem variações do mesmo exercício)
        const vistos = new Set();
        const convertidos = [];
        for (const item of dados.results || []) {
            const exercicio = converterExercicioWger(item);
            if (exercicio && !vistos.has(normalizarTexto(exercicio.nome))) {
                vistos.add(normalizarTexto(exercicio.nome));
                convertidos.push(exercicio);
            }
        }
        return convertidos;
    } finally {
        clearTimeout(temporizador);
    }
}

/* ---------- Interface ---------- */

function jaNaBiblioteca(nome) {
    return exercicios.some((exercicio) => normalizarTexto(exercicio.nome) === normalizarTexto(nome));
}

function mostrarStatusApi(mensagem, tipo) {
    statusApiEl.textContent = mensagem;
    statusApiEl.className = `api-status api-status--${tipo}`;
}

function criarItemResultado(resultado, indice) {
    const item = document.createElement('li');
    item.className = 'api-result';

    if (resultado.imagem) {
        const imagem = document.createElement('img');
        imagem.src = resultado.imagem;
        imagem.alt = '';
        imagem.loading = 'lazy';
        imagem.className = 'api-result-img';
        item.append(imagem);
    } else {
        const semImagem = document.createElement('span');
        semImagem.className = 'api-result-img api-result-img--vazia';
        semImagem.setAttribute('aria-hidden', 'true');
        semImagem.textContent = '🏋️';
        item.append(semImagem);
    }

    const info = document.createElement('div');
    info.className = 'api-result-info';
    const titulo = document.createElement('h3');
    titulo.textContent = resultado.nome;
    const detalhes = document.createElement('p');
    const musculos = resultado.musculos.length > 0 ? ` · ${resultado.musculos.join(', ')}` : '';
    detalhes.textContent = `${GRUPOS[resultado.grupo]} · ${EQUIPAMENTOS[resultado.equipamento]}${musculos}`;
    info.append(titulo, detalhes);

    const botao = document.createElement('button');
    botao.type = 'button';
    botao.dataset.indice = indice;
    if (jaNaBiblioteca(resultado.nome)) {
        botao.className = 'btn-secondary';
        botao.disabled = true;
        botao.textContent = '✓ Na biblioteca';
    } else {
        botao.className = 'btn-primary';
        botao.textContent = '➕ Adicionar';
        botao.setAttribute('aria-label', `Adicionar ${resultado.nome} à biblioteca`);
    }

    item.append(info, botao);
    return item;
}

function renderizarResultados() {
    resultadosApiEl.replaceChildren();
    resultadosWger.forEach((resultado, indice) => {
        resultadosApiEl.append(criarItemResultado(resultado, indice));
    });
}

formApiEl.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const termo = buscaApiEl.value.trim();
    if (termo.length < 2) {
        mostrarStatusApi('Digite pelo menos 2 letras para pesquisar.', 'erro');
        buscaApiEl.focus();
        return;
    }

    botaoBuscarApiEl.disabled = true;
    botaoBuscarApiEl.textContent = 'Buscando...';
    mostrarStatusApi(`Buscando "${termo}" na base wger...`, 'carregando');
    resultadosApiEl.replaceChildren();

    try {
        resultadosWger = await buscarNaWger(termo);
        if (resultadosWger.length === 0) {
            mostrarStatusApi(`Nenhum exercício encontrado na wger para "${termo}".`, 'neutro');
        } else {
            mostrarStatusApi(`${resultadosWger.length} resultado(s) para "${termo}". Escolha um para adicionar.`, 'neutro');
            renderizarResultados();
        }
    } catch (erro) {
        resultadosWger = [];
        const mensagem = erro.name === 'AbortError'
            ? 'A wger demorou demais para responder. Tente de novo em instantes.'
            : 'Não foi possível conectar à wger. Verifique sua internet e tente de novo.';
        mostrarStatusApi(mensagem, 'erro');
        console.warn('Falha na busca da wger:', erro);
    } finally {
        botaoBuscarApiEl.disabled = false;
        botaoBuscarApiEl.textContent = '🔎 Buscar';
    }
});

/* Adicionar: o resultado da API vira um exercício da biblioteca (localStorage) */
resultadosApiEl.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-indice]');
    if (!botao || botao.disabled) {
        return;
    }

    const resultado = resultadosWger[Number(botao.dataset.indice)];
    const dados = {
        nome: resultado.nome,
        grupo: resultado.grupo,
        equipamento: resultado.equipamento,
        carga: null,
        tipo: resultado.tipo,
        instrucoes: resultado.instrucoes
    };

    // Mesmas regras do formulário (evita duplicar um exercício já cadastrado)
    const erros = validarExercicio(dados, null);
    if (Object.keys(erros).length > 0) {
        mostrarAviso(Object.values(erros)[0]);
        renderizarResultados();
        return;
    }

    const novo = cadastrarExercicio(dados, {
        imagem: resultado.imagem,
        origem: 'wger',
        wgerId: resultado.wgerId
    });

    atualizarTela();
    renderizarResultados();
    mostrarAviso(`"${novo.nome}" foi adicionado. Edite para registrar sua carga.`);
    destacarCard(novo.id);
});

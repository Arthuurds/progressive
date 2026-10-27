/* =========================================================
   PROGRESSIVE — Biblioteca de exercícios
   Listagem dinâmica dos exercícios salvos no localStorage.
   ========================================================= */

/* Estado da página: lista mantida em memória e sincronizada com o localStorage */
let exercicios = carregarExercicios();

const listaEl = document.getElementById('lista-exercicios');
const contadorEl = document.getElementById('contador-exercicios');

/* ---------- Listagem ---------- */

function criarCardExercicio(exercicio) {
    const card = document.createElement('article');
    card.className = 'library-card';
    card.dataset.id = exercicio.id;

    const tag = document.createElement('span');
    tag.className = 'group-tag';
    tag.textContent = (GRUPOS[exercicio.grupo] || exercicio.grupo).toUpperCase();

    const titulo = document.createElement('h3');
    titulo.textContent = exercicio.nome;

    const recorde = document.createElement('p');
    recorde.append('Recorde Atual: ');
    const valor = document.createElement('strong');
    valor.textContent = formatarCarga(exercicio.carga);
    recorde.append(valor);

    const tendencia = calcularTendencia(exercicio);
    const trend = document.createElement('p');
    trend.className = `trend trend-${tendencia.tipo}`;
    trend.textContent = tendencia.texto;

    card.append(tag, titulo, recorde, trend);

    // Instruções expansíveis, só quando o exercício tem passos cadastrados
    const passos = separarPassos(exercicio.instrucoes);
    if (passos.length > 0) {
        const detalhes = document.createElement('details');
        detalhes.className = 'exercise-instructions';
        const resumo = document.createElement('summary');
        resumo.textContent = 'Como executar';
        const listaPassos = document.createElement('ol');
        for (const passo of passos) {
            const item = document.createElement('li');
            item.textContent = passo;
            listaPassos.append(item);
        }
        detalhes.append(resumo, listaPassos);
        card.append(detalhes);
    }

    const acoes = document.createElement('div');
    acoes.className = 'card-actions';

    const linkDetalhes = document.createElement('a');
    linkDetalhes.className = 'btn-link';
    linkDetalhes.href = `detalhes.html?id=${encodeURIComponent(exercicio.id)}`;
    linkDetalhes.textContent = '📊 Ver Detalhes';
    acoes.append(linkDetalhes);

    card.append(acoes);
    return card;
}

function renderizarLista(lista) {
    listaEl.replaceChildren();

    if (lista.length === 0) {
        const vazio = document.createElement('p');
        vazio.className = 'lista-vazia';
        vazio.textContent = 'Nenhum exercício encontrado.';
        listaEl.append(vazio);
    } else {
        for (const exercicio of lista) {
            listaEl.append(criarCardExercicio(exercicio));
        }
    }

    const total = exercicios.length;
    contadorEl.textContent = lista.length === total
        ? `${total} exercício${total === 1 ? '' : 's'} cadastrado${total === 1 ? '' : 's'}`
        : `Mostrando ${lista.length} de ${total} exercícios`;
}

function atualizarTela() {
    renderizarLista(exercicios);
}

atualizarTela();

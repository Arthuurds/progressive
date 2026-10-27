/* =========================================================
   PROGRESSIVE — Detalhes do exercício
   Lê o id da URL (detalhes.html?id=...) e mostra os dados
   salvos no localStorage.
   ========================================================= */

const parametros = new URLSearchParams(window.location.search);
const idExercicio = parametros.get('id');
const exercicio = buscarExercicioPorId(carregarExercicios(), idExercicio);

function mostrarNaoEncontrado() {
    document.getElementById('detalhe-card').hidden = true;
    document.getElementById('detalhe-historico-card').hidden = true;
    document.getElementById('detalhe-nao-encontrado').hidden = false;
    document.title = 'Progressive — Exercício não encontrado';
}

/* Linha "Rótulo: valor" com o rótulo em negrito */
function adicionarInfo(elemento, rotulo, valor) {
    if (elemento.childNodes.length > 0) {
        elemento.append(' | ');
    }
    const forte = document.createElement('strong');
    forte.textContent = `${rotulo}:`;
    elemento.append(forte, ` ${valor}`);
}

function preencherCabecalho() {
    document.title = `Progressive — ${exercicio.nome}`;
    document.getElementById('detalhe-nome').textContent = exercicio.nome;

    const meta = document.getElementById('detalhe-meta');
    adicionarInfo(meta, 'Grupo', GRUPOS[exercicio.grupo] || exercicio.grupo);
    adicionarInfo(meta, 'Equipamento', EQUIPAMENTOS[exercicio.equipamento] || exercicio.equipamento);
    adicionarInfo(meta, 'Tipo', TIPOS[exercicio.tipo] || exercicio.tipo);
    adicionarInfo(meta, 'Recorde Atual', formatarCarga(exercicio.carga));
    if (exercicio.origem === 'wger') {
        adicionarInfo(meta, 'Fonte', 'base wger');
    }

    // Leva para a biblioteca já com o formulário em modo de edição
    document.getElementById('detalhe-editar').href =
        `biblioteca.html?editar=${encodeURIComponent(exercicio.id)}#form-cadastro-exercicio`;
}

function preencherImagem() {
    if (!exercicio.imagem) {
        // Sem imagem: as instruções ocupam a largura toda
        document.getElementById('detalhe-grid').classList.add('sem-imagem');
        return;
    }
    const imagem = document.getElementById('detalhe-imagem');
    imagem.src = exercicio.imagem;
    imagem.alt = `Demonstração da execução de ${exercicio.nome}`;
    document.getElementById('detalhe-legenda').textContent = `Execução de ${exercicio.nome}.`;
    document.getElementById('detalhe-figura').hidden = false;
}

function preencherPassos() {
    const lista = document.getElementById('detalhe-passos');
    const passos = separarPassos(exercicio.instrucoes);

    if (passos.length === 0) {
        const item = document.createElement('li');
        item.textContent = 'Nenhuma instrução cadastrada. Edite o exercício para adicionar os passos.';
        lista.append(item);
        return;
    }

    passos.forEach((passo) => {
        const item = document.createElement('li');
        item.textContent = passo;
        lista.append(item);
    });
}

function textoEvolucao(atual, anterior) {
    if (anterior === undefined) {
        return '• Primeiro registro';
    }
    const diferenca = atual - anterior;
    if (diferenca > 0) {
        return `🟢 +${formatarCarga(diferenca)}`;
    }
    if (diferenca < 0) {
        return `🔴 −${formatarCarga(Math.abs(diferenca))}`;
    }
    return '⚪ Mantido';
}

function preencherHistorico() {
    const corpo = document.getElementById('detalhe-historico');
    const historico = exercicio.historico || [];

    document.getElementById('detalhe-caption').textContent =
        `Registros de carga de ${exercicio.nome}, do mais recente para o mais antigo.`;

    if (historico.length === 0) {
        const linha = corpo.insertRow();
        const celula = linha.insertCell();
        celula.colSpan = 3;
        celula.textContent = 'Nenhuma carga registrada ainda.';
        return;
    }

    // Percorre do mais recente para o mais antigo, comparando com o registro anterior
    for (let i = historico.length - 1; i >= 0; i--) {
        const registro = historico[i];
        const anterior = i > 0 ? historico[i - 1].carga : undefined;
        const linha = corpo.insertRow();

        const data = document.createElement('time');
        data.dateTime = registro.data;
        data.textContent = formatarData(registro.data);
        linha.insertCell().append(data);

        const carga = linha.insertCell();
        if (i === historico.length - 1) {
            const forte = document.createElement('strong');
            forte.textContent = formatarCarga(registro.carga);
            carga.append(forte);
        } else {
            carga.textContent = formatarCarga(registro.carga);
        }

        linha.insertCell().textContent = textoEvolucao(registro.carga, anterior);
    }
}

if (exercicio) {
    preencherCabecalho();
    preencherImagem();
    preencherPassos();
    preencherHistorico();
} else {
    mostrarNaoEncontrado();
}

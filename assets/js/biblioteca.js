/* =========================================================
   PROGRESSIVE — Biblioteca de exercícios
   Listagem dinâmica dos exercícios salvos no localStorage.
   ========================================================= */

/* Estado da página: lista mantida em memória e sincronizada com o localStorage */
let exercicios = carregarExercicios();

const listaEl = document.getElementById('lista-exercicios');
const contadorEl = document.getElementById('contador-exercicios');
const buscaEl = document.getElementById('busca');
const filtroGrupoEl = document.getElementById('grupo');
const ordenarEl = document.getElementById('ordenar');

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

    // Os botões só guardam a ação e o id; o clique é tratado na lista (delegação de eventos)
    const botaoEditar = document.createElement('button');
    botaoEditar.type = 'button';
    botaoEditar.className = 'btn-secondary';
    botaoEditar.dataset.acao = 'editar';
    botaoEditar.dataset.id = exercicio.id;
    botaoEditar.setAttribute('aria-label', `Editar ${exercicio.nome}`);
    botaoEditar.textContent = '✏️ Editar';

    const botaoExcluir = document.createElement('button');
    botaoExcluir.type = 'button';
    botaoExcluir.className = 'btn-danger';
    botaoExcluir.dataset.acao = 'excluir';
    botaoExcluir.dataset.id = exercicio.id;
    botaoExcluir.setAttribute('aria-label', `Excluir ${exercicio.nome}`);
    botaoExcluir.textContent = '🗑️ Excluir';

    acoes.append(botaoEditar, botaoExcluir);

    card.append(acoes);
    return card;
}

function renderizarLista(lista) {
    listaEl.replaceChildren();

    if (lista.length === 0) {
        const vazio = document.createElement('p');
        vazio.className = 'lista-vazia';
        vazio.textContent = exercicios.length === 0
            ? 'Sua biblioteca está vazia. Cadastre o primeiro exercício acima.'
            : 'Nenhum exercício encontrado. Tente outro termo ou limpe os filtros.';
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

/* ---------- Pesquisa e filtro ---------- */

/* Pesquisa pelo nome (sem diferenciar maiúsculas nem acentos)
   e filtra pelo grupo muscular escolhido */
function filtrarExercicios() {
    const termo = normalizarTexto(buscaEl.value);
    const grupo = filtroGrupoEl.value;

    return exercicios.filter((exercicio) => {
        const nomeConfere = normalizarTexto(exercicio.nome).includes(termo);
        const grupoConfere = grupo === 'todos' || exercicio.grupo === grupo;
        return nomeConfere && grupoConfere;
    });
}

/* ---------- Ordenação ---------- */

function compararNomes(a, b) {
    return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
}

/* Exercícios sem carga registrada ficam no fim nas ordenações por recorde */
function cargaParaOrdenar(exercicio, semCarga) {
    return exercicio.carga === null || exercicio.carga === undefined ? semCarga : exercicio.carga;
}

/* Devolve uma cópia ordenada; a lista original (e o localStorage) não muda */
function ordenarExercicios(lista) {
    const copia = [...lista];

    switch (ordenarEl.value) {
        case 'nome-desc':
            return copia.sort((a, b) => compararNomes(b, a));
        case 'pr-desc':
            return copia.sort((a, b) => cargaParaOrdenar(b, -Infinity) - cargaParaOrdenar(a, -Infinity));
        case 'pr-asc':
            return copia.sort((a, b) => cargaParaOrdenar(a, Infinity) - cargaParaOrdenar(b, Infinity));
        case 'grupo':
            return copia.sort((a, b) =>
                GRUPOS[a.grupo].localeCompare(GRUPOS[b.grupo], 'pt-BR') || compararNomes(a, b));
        case 'recentes':
            return copia.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
        default:
            return copia.sort(compararNomes);
    }
}

function atualizarTela() {
    renderizarLista(ordenarExercicios(filtrarExercicios()));
}

buscaEl.addEventListener('input', atualizarTela);
filtroGrupoEl.addEventListener('change', atualizarTela);
ordenarEl.addEventListener('change', atualizarTela);

/* Realça um card recém-salvo e rola a página até ele */
function destacarCard(id) {
    const card = listaEl.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (!card) {
        return;
    }
    card.classList.add('card-destaque');
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => card.classList.remove('card-destaque'), 2000);
}

/* ---------- Cadastro ---------- */

const formEl = document.getElementById('form-exercicio');
const feedbackEl = document.getElementById('form-feedback');

/* Campo validado -> id do input e id do parágrafo de erro */
const CAMPOS_FORM = {
    nome: { input: 'nome-exercicio', erro: 'erro-nome' },
    grupo: { input: 'grupo-muscular', erro: 'erro-grupo' },
    equipamento: { input: 'equipamento', erro: 'erro-equipamento' },
    carga: { input: 'carga-inicial', erro: 'erro-carga' },
    instrucoes: { input: 'instrucoes', erro: 'erro-instrucoes' }
};

function lerFormulario() {
    const dados = new FormData(formEl);
    const cargaTexto = String(dados.get('carga_inicial') || '').trim();

    return {
        nome: String(dados.get('nome_exercicio') || '').trim().replace(/\s+/g, ' '),
        grupo: dados.get('grupo_muscular'),
        equipamento: dados.get('equipamento'),
        carga: cargaTexto === '' ? null : Number(cargaTexto),
        tipo: dados.get('tipo_exercicio') || 'composto',
        instrucoes: String(dados.get('instrucoes') || '').trim()
    };
}

/* Retorna um objeto { campo: mensagem }; vazio quando está tudo certo.
   idIgnorado evita acusar duplicidade com o próprio exercício na edição. */
function validarExercicio(dados, idIgnorado) {
    const erros = {};

    if (dados.nome.length < 3) {
        erros.nome = 'Informe um nome com pelo menos 3 caracteres.';
    } else if (dados.nome.length > 60) {
        erros.nome = 'O nome pode ter no máximo 60 caracteres.';
    } else {
        const duplicado = exercicios.some((exercicio) =>
            exercicio.id !== idIgnorado && normalizarTexto(exercicio.nome) === normalizarTexto(dados.nome));
        if (duplicado) {
            erros.nome = 'Já existe um exercício com esse nome na biblioteca.';
        }
    }

    if (!(dados.grupo in GRUPOS)) {
        erros.grupo = 'Escolha o grupo muscular principal.';
    }

    if (!(dados.equipamento in EQUIPAMENTOS)) {
        erros.equipamento = 'Escolha o equipamento necessário.';
    }

    if (dados.carga !== null) {
        if (Number.isNaN(dados.carga)) {
            erros.carga = 'Digite um número válido.';
        } else if (dados.carga < 0 || dados.carga > 500) {
            erros.carga = 'A carga deve ficar entre 0 e 500 kg.';
        }
    }

    if (dados.instrucoes.length > 1000) {
        erros.instrucoes = 'As instruções podem ter no máximo 1000 caracteres.';
    }

    return erros;
}

function mostrarErros(erros) {
    let primeiroInvalido = null;

    for (const [campo, ids] of Object.entries(CAMPOS_FORM)) {
        const input = document.getElementById(ids.input);
        const erroEl = document.getElementById(ids.erro);
        const mensagem = erros[campo] || '';

        erroEl.textContent = mensagem;
        if (mensagem) {
            input.setAttribute('aria-invalid', 'true');
            primeiroInvalido = primeiroInvalido || input;
        } else {
            input.removeAttribute('aria-invalid');
        }
    }

    if (primeiroInvalido) {
        primeiroInvalido.focus();
    }
}

function mostrarFeedback(mensagem, tipo) {
    feedbackEl.textContent = mensagem;
    feedbackEl.className = `form-feedback form-feedback--${tipo}`;
}

function criarExercicio(dados) {
    return {
        id: gerarId(),
        ...dados,
        historico: dados.carga !== null ? [{ data: hojeIso(), carga: dados.carga }] : [],
        imagem: null,
        origem: 'manual',
        criadoEm: new Date().toISOString()
    };
}

function cadastrarExercicio(dados) {
    const novo = criarExercicio(dados);
    exercicios.push(novo);
    salvarExercicios(exercicios);
    return novo;
}

/* ---------- Edição ---------- */

const idEditandoEl = document.getElementById('exercicio-id');
const tituloFormEl = document.getElementById('titulo-form');
const botaoSalvarEl = document.getElementById('btn-salvar');
const botaoCancelarEl = document.getElementById('btn-cancelar');

function entrarModoEdicao(id) {
    const exercicio = buscarExercicioPorId(exercicios, id);
    if (!exercicio) {
        return;
    }

    idEditandoEl.value = exercicio.id;
    formEl.elements.nome_exercicio.value = exercicio.nome;
    formEl.elements.grupo_muscular.value = exercicio.grupo;
    formEl.elements.equipamento.value = exercicio.equipamento;
    formEl.elements.carga_inicial.value = exercicio.carga ?? '';
    formEl.elements.tipo_exercicio.value = exercicio.tipo;
    formEl.elements.instrucoes.value = exercicio.instrucoes || '';

    tituloFormEl.textContent = `Editar: ${exercicio.nome}`;
    botaoSalvarEl.textContent = '💾 Salvar Alterações';
    botaoCancelarEl.hidden = false;
    mostrarErros({});
    mostrarFeedback('', 'neutro');

    document.getElementById('form-cadastro-exercicio').scrollIntoView({ behavior: 'smooth', block: 'start' });
    formEl.elements.nome_exercicio.focus({ preventScroll: true });
}

function sairModoEdicao() {
    formEl.reset();
    idEditandoEl.value = '';
    tituloFormEl.textContent = 'Cadastrar Novo Exercício';
    botaoSalvarEl.textContent = '💾 Salvar Exercício';
    botaoCancelarEl.hidden = true;
    mostrarErros({});
}

function editarExercicio(id, dados) {
    const exercicio = buscarExercicioPorId(exercicios, id);
    const cargaMudou = dados.carga !== null && dados.carga !== exercicio.carga;

    Object.assign(exercicio, dados);

    // Nova carga vira um registro no histórico (um por dia)
    if (cargaMudou) {
        exercicio.historico = exercicio.historico || [];
        const ultimo = exercicio.historico[exercicio.historico.length - 1];
        if (ultimo && ultimo.data === hojeIso()) {
            ultimo.carga = dados.carga;
        } else {
            exercicio.historico.push({ data: hojeIso(), carga: dados.carga });
        }
    }

    salvarExercicios(exercicios);
    return exercicio;
}

formEl.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const idEditando = idEditandoEl.value || null;
    const dados = lerFormulario();
    const erros = validarExercicio(dados, idEditando);
    mostrarErros(erros);

    if (Object.keys(erros).length > 0) {
        mostrarFeedback('Corrija os campos destacados para salvar.', 'erro');
        return;
    }

    if (idEditando) {
        const editado = editarExercicio(idEditando, dados);
        sairModoEdicao();
        atualizarTela();
        mostrarFeedback(`"${editado.nome}" foi atualizado.`, 'sucesso');
        destacarCard(editado.id);
    } else {
        const novo = cadastrarExercicio(dados);
        formEl.reset();
        atualizarTela();
        mostrarFeedback(`"${novo.nome}" foi cadastrado na biblioteca.`, 'sucesso');
        destacarCard(novo.id);
    }
});

botaoCancelarEl.addEventListener('click', () => {
    sairModoEdicao();
    mostrarFeedback('Edição cancelada.', 'neutro');
});

/* ---------- Exclusão ---------- */

const avisoEl = document.getElementById('aviso');
let temporizadorAviso = null;

/* Mensagem flutuante no rodapé, some sozinha depois de alguns segundos */
function mostrarAviso(mensagem) {
    avisoEl.textContent = mensagem;
    avisoEl.hidden = false;
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => {
        avisoEl.hidden = true;
    }, 3500);
}

function excluirExercicio(id) {
    const exercicio = buscarExercicioPorId(exercicios, id);
    if (!exercicio) {
        return;
    }

    const confirmou = window.confirm(`Excluir "${exercicio.nome}" da biblioteca?\nO histórico de cargas também será apagado.`);
    if (!confirmou) {
        return;
    }

    exercicios = exercicios.filter((item) => item.id !== id);
    salvarExercicios(exercicios);

    // Se o exercício excluído estava aberto no formulário, cancela a edição
    if (idEditandoEl.value === id) {
        sairModoEdicao();
        mostrarFeedback('', 'neutro');
    }

    atualizarTela();
    mostrarAviso(`"${exercicio.nome}" foi excluído.`);
}

/* Cliques nos botões dos cards (delegação: um único ouvinte para todos) */
listaEl.addEventListener('click', (evento) => {
    const botao = evento.target.closest('button[data-acao]');
    if (!botao) {
        return;
    }
    if (botao.dataset.acao === 'editar') {
        entrarModoEdicao(botao.dataset.id);
    } else if (botao.dataset.acao === 'excluir') {
        excluirExercicio(botao.dataset.id);
    }
});

/* Ao corrigir um campo, a mensagem de erro dele some */
formEl.addEventListener('input', (evento) => {
    for (const ids of Object.values(CAMPOS_FORM)) {
        if (evento.target.id === ids.input) {
            evento.target.removeAttribute('aria-invalid');
            document.getElementById(ids.erro).textContent = '';
        }
    }
});

atualizarTela();

/* Vindo da página de detalhes: biblioteca.html?editar=<id> já abre a edição */
const idParaEditar = new URLSearchParams(window.location.search).get('editar');
if (idParaEditar) {
    entrarModoEdicao(idParaEditar);
}

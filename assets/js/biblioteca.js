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

formEl.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const dados = lerFormulario();
    const erros = validarExercicio(dados, null);
    mostrarErros(erros);

    if (Object.keys(erros).length > 0) {
        mostrarFeedback('Corrija os campos destacados para salvar.', 'erro');
        return;
    }

    const novo = cadastrarExercicio(dados);
    formEl.reset();
    atualizarTela();
    mostrarFeedback(`"${novo.nome}" foi cadastrado na biblioteca.`, 'sucesso');
    destacarCard(novo.id);
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

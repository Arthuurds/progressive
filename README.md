# Progressive

Aplicação web para acompanhar treinos de academia e a **sobrecarga progressiva**, ou seja, o aumento gradual de carga em cada exercício.

Feita com **HTML, CSS e JavaScript puro** (sem frameworks). Os dados ficam salvos no navegador com **localStorage**, e a biblioteca pode importar exercícios da **API pública wger**.

## Funcionalidades

### Biblioteca de exercícios
- **Cadastro, edição e exclusão** de exercícios com nome, grupo muscular, equipamento, tipo (composto ou isolador), carga inicial e instruções de execução
- **Validação do formulário**, com mensagens de erro e bloqueio de nomes duplicados
- **Busca, filtro** por grupo muscular e **ordenação** (por nome, recorde de carga, grupo ou mais recentes)
- **Histórico de cargas**: ao atualizar a carga de um exercício, o valor novo entra no histórico com a data
- **Importação da base wger**: busca exercícios na API pública e os adiciona à biblioteca, com nome, músculo, equipamento, instruções e imagem
- **Persistência no localStorage**: os exercícios continuam salvos ao fechar o navegador

### Detalhes do exercício
- Página com os dados do exercício, imagem e passo a passo de execução
- **Histórico de cargas** com indicação de evolução em relação ao treino anterior

### Telas da interface (layout)
Estas páginas estão prontas em HTML e CSS e ainda não têm lógica em JavaScript:
- Login e cadastro
- Dashboard com métricas, recordes pessoais e mapa muscular
- Rotinas de treino e sessão em andamento
- Gráfico de evolução de carga
- Calculadora de 1RM (fórmula de Epley)

## Tecnologias

- **HTML5** semântico, com atenção à acessibilidade (rótulos, `aria-*`, textos para leitores de tela)
- **CSS3**, com layout responsivo
- **JavaScript (ES6+)**: manipulação do DOM, eventos, `fetch` com `async/await` e localStorage
- **API REST pública:** [wger](https://wger.de/api/v2/)

## Estrutura do projeto

```
progressive/
├── index.html              # Login / cadastro
├── pages/
│   ├── dashboard.html      # Visão geral
│   ├── biblioteca.html     # Biblioteca de exercícios
│   ├── detalhes.html       # Detalhes de um exercício
│   ├── treinos.html        # Rotinas de treino
│   ├── sessao.html         # Sessão em andamento
│   ├── evolucao.html       # Evolução de carga
│   └── calculadora.html    # Calculadora de 1RM
└── assets/
    ├── css/style.css
    ├── js/
    │   ├── script.js       # Funções compartilhadas e acesso ao localStorage
    │   ├── biblioteca.js   # CRUD, busca, filtros e ordenação
    │   ├── api.js          # Integração com a API wger
    │   └── detalhes.js     # Página de detalhes e histórico
    ├── img/                # Logo, ícones e imagens
    └── video/
```

## Como executar

Não precisa instalar nada.

1. Clone o repositório:
   ```bash
   git clone https://github.com/Arthuurds/progressive.git
   ```
2. Abra a pasta no VS Code e rode o `index.html` com a extensão **Live Server**. Você também pode abrir o arquivo direto no navegador.

> Para importar exercícios da wger é preciso estar conectado à internet.

## Próximos passos

- Ligar as telas de rotinas, sessão e evolução aos dados salvos
- Fazer a calculadora de 1RM funcionar
- Gerar o gráfico de evolução a partir do histórico de cargas

## Créditos

Os exercícios importados vêm da base [wger](https://wger.de) (licença CC-BY-SA 4.0). O desenho do mapa muscular vem do [MuscleMap](https://github.com/melihcolpan/MuscleMap) (licença MIT). Detalhes em [CREDITOS.md](CREDITOS.md).

## Autor

**Arthur Dornas**: estudante de Engenharia de Software (PUC Minas) e Técnico em Desenvolvimento de Sistemas (Senac)
[GitHub](https://github.com/Arthuurds) · [LinkedIn](https://www.linkedin.com/in/arthur-dornas-8971663a8/)

# Refinamento estúdio

Sete etapas implementadas e descritas separadamente durante a execução: CTA vermelho, carrosséis sem scrollbar com setas, badge condicional, superfícies em dois níveis, hover/foco com revelação da cor, destaque duplo em Recomendados e hero clicável.

- Apresentação usa os dados e ranking já existentes. Sem createdAt em Barbershop, não se inventa recência; o desempate estável do ranking serve de fallback sem reviews.
- Hero usa gradiente ink 60% → transparente e fundo local ink 80% sob o texto, garantindo legibilidade sem cobrir pesadamente toda a foto.
- Fotos mantêm o duotone SVG em repouso; variável CSS permite revelar cor no hover/foco. Transições de filtros SVG podem variar por navegador; validar em navegadores reais.
- Setas usam scrollBy e respeitam movimento reduzido; área também aceita teclado e toque. A inclusão de JS foi restrita à interação de rolagem, ausente anteriormente.
- Recomendados: primeiro item ocupa duas colunas. Populares e busca mantêm larguras uniformes.
- Tipos, lint e build de produção aprovados. Smoke HTTP da home retornou 200 e confirmou markup do hero, setas, destaque e filtro.
- Sem alterações em actions, dados, schema ou migrations. Sem dependências novas.
- Revisão por descrição, sem screenshot: a captura de navegador foi bloqueada pela revisão automática anteriormente. Cliques, transições e composição visual final ainda precisam de conferência manual em desktop/mobile.

Contraste calculado: texto secundário/surface-2 7,15:1; bone sobre fundo local do hero, mesmo com imagem clara, 8,04:1.

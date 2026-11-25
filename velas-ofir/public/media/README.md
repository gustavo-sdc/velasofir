# Mídias do site

Coloque suas imagens em `images/` e o vídeo em `videos/`.

A home reconhece automaticamente estes nomes (imagens em WebP, JPG, JPEG ou PNG, com extensão minúscula):

| Arquivo | Local |
| --- | --- |
| `images/home-principal.jpg` | Imagem principal da home |
| `images/home-detalhe.jpg` | Foto menor sobreposta à principal |
| `images/home-colecao.jpg` | Cartão de velas |
| `images/home-presente.jpg` | Cartão de presentes |
| `videos/workshop.mp4` | Vídeo de fundo da seção Experiências Ofir |

O vídeo toca automaticamente, sem áudio, em loop e dentro da página no celular. Use MP4 com codec H.264 para ampla compatibilidade e prefira um arquivo leve.

Imagens ausentes preservam o fundo da seção. O vídeo é carregado diretamente de `/media/videos/workshop.mp4`; mantenha esse arquivo no projeto. As fotos de produtos do catálogo não são usadas na composição da home. O catálogo da loja continua gerenciado pelo painel.

Depois de adicionar os arquivos, atualize a página durante o desenvolvimento. No site publicado, faça um novo build/deploy. O mapeamento dos nomes está em `src/platform/server/site-media.ts`.

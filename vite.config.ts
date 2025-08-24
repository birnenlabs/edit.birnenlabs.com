import { defineConfig } from 'vite';
import {VitePWA} from 'vite-plugin-pwa';


export default defineConfig({
  build: {
    minify: true,
  },
  plugins: [
    VitePWA({
      manifest: {
        display: 'standalone',
        name: 'Text Editor',
        short_name: 'Text Editor',
        // Explicitely unset colors to use system default.
        background_color: '',
        theme_color: '',
        icons: [
          {
            src: './icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        file_handlers: [
          {
            action: './index.html',
            accept: {
              'text/plain': [
                '.txt', '.text', '.log', '.out', '.err', '.readme', '.info', '.nfo',
                '.ini', '.cfg', '.conf', '.config', '.properties', '.env', '.prefs', '.settings',
                '.gitconfig', '.gitattributes', '.gitignore', '.gitmodules',
                '.editorconfig',
                '.diff', '.patch',
                '.srt', '.sub', '.vtt', '.ass', '.ssa',
              ],

              'application/json': ['.json', '.jsonc', '.geojson', '.webmanifest', '.jsonl', '.tfstate'],
              'application/yaml': ['.yaml', '.yml'],

              'text/csv': ['.csv'],
              'text/html': ['.css', '.html', '.htm', '.xhtml'],
              'text/markdown': ['.md', '.markdown', '.mdown'],
              'text/tab-separated-values': ['.tsv'],
              'text/xml': ['.xml', '.xsd', '.xsl', '.xslt', '.rss', '.atom', '.kml', '.gpx', '.plist', '.dae', '.collada', '.storyboard', '.xib'],

              'text/x-c-source': ['.c', '.h', '.idc', '.cpp', '.hpp', '.cc', '.hh', '.cxx', '.hxx', '.cs', '.m', '.mm'],
              'text/x-clojure': ['.clj', '.cljs', '.cljc', '.edn'],
              'text/x-cobol': ['.cob', '.cbl'],
              'text/x-dockerfile': ['.dockerfile'],
              'text/x-erlang': ['.erl', '.hrl'],
              'text/x-fortran': ['.f', '.for', '.f90', '.f95', '.f03'],
              'text/x-go': ['.go'],
              'text/x-groovy': ['.groovy', '.gvy', '.gy', '.gsh'],
              'text/x-haskell': ['.hs', '.lhs'],
              'text/x-java-source': ['.java', '.jsp', '.kt', '.kts', '.scala', '.sc'],
              'text/x-javascript': ['.js', '.mjs', '.cjs', '.jsx', '.es', '.es6', '.ts', '.tsx', '.jsx'],
              'text/x-lua': ['.lua'],
              'text/x-makefile': ['.mk', '.make'],
              'text/x-pascal': ['.pas', '.pp', '.inc'],
              'text/x-perl': ['.pl', '.pm', '.t'],
              'text/x-php': ['.php', '.php3', '.php4', '.php5', '.phtml'],
              'text/x-protobuf': ['.proto'],
              'text/x-python': ['.py', '.pyw', '.pyc', '.pyd', '.pxd'],
              'text/x-rst': ['.rst'],
              'text/x-ruby': ['.rb', '.rbw', '.rake'],
              'text/x-rust': ['.rs'],
              'text/x-shellscript': ['.sh', '.bash', '.zsh', '.csh', '.ksh', '.fish', '.bat', '.cmd', '.ps1', '.psm1', '.psd1', '.awk', '.sed'],
              'text/x-sql': ['.sql'],
              'text/x-swift': ['.swift'],
              'text/x-tex': ['.tex', '.latex', '.sty', '.cls'],

              'image/svg+xml': ['.svg'],
            },
            // @ts-ignore
            launch_type: 'single-client',
          },
        ],
      },
    }),
  ],
})
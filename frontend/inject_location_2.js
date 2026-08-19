const fs = require('fs');
let code = fs.readFileSync('src/components/layout.tsx', 'utf8');

code = code.replace(
  '        </div>\n  \n        <div className="flex flex-1 flex-col overflow-y-auto py-5 px-3">',
  '        </div>\n        <CurrentLocationIndicator />\n        <div className="flex flex-1 flex-col overflow-y-auto py-5 px-3">'
);

code = code.replace(
  '          </div>\n        </div>\n      </header>',
  '          </div>\n        </div>\n        <CurrentLocationIndicator isMobile={true} />\n      </header>'
);

fs.writeFileSync('src/components/layout.tsx', code);
console.log('Injected properly');

const fs = require('fs');
const file = 'src/components/SettingsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(/import React from 'react';\\nimport \{ useAppContext \} from '\.\.\/store\/AppContext';\\nimport \{ Settings, Trash2, CheckCircle2, LayoutPanelLeft, Palette, ShieldAlert \} from 'lucide-react';\\nimport \{ AutoDeleteMode, NavbarPosition \} from '\.\.\/types';\\nimport \{ Database, WifiOff, Download, Upload \} from 'lucide-react';\\nimport React, \{ useRef \} from 'react';/, 
`import React, { useRef } from 'react';
import { useAppContext } from '../store/AppContext';
import { Settings, Trash2, CheckCircle2, LayoutPanelLeft, Palette, ShieldAlert, Database, WifiOff, Download, Upload } from 'lucide-react';
import { AutoDeleteMode, NavbarPosition } from '../types';`);

// Just do string replace for the duplicate React
code = code.replace("import React from 'react';\n", "");
code = code.replace("import React, { useRef } from 'react';\n", "");
code = "import React, { useRef } from 'react';\n" + code;

fs.writeFileSync(file, code);

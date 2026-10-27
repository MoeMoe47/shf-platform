import {build,loadConfigFromFile} from '/Users/mikeslate/Projects/shrv1/node_modules/vite/dist/node/index.js';
const root='/Users/mikeslate/Projects/shrv1';
const loaded=await loadConfigFromFile({command:'build',mode:'production'},root+'/vite.config.js');
const names=['oas','oas-1','oas-control-domains','oas-purpose-boundaries','oas-risk-classification'];
await build({...loaded.config,root,configFile:false,build:{...loaded.config.build,outDir:'/private/tmp/oas-website-audit-bn1nv8t9/oas-build',emptyOutDir:true,copyPublicDir:false,
 rollupOptions:{...loaded.config.build.rollupOptions,input:Object.fromEntries(names.map(n=>[n,root+'/'+n+'.html']))}}});
console.log('PASS: five-entry OAS-only production compilation. Public asset copying intentionally omitted; live assets checked separately.');

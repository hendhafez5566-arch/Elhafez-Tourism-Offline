// Work around restricted Windows accounts where os.userInfo() is unavailable.
const os=require('node:os');
try{os.userInfo();}catch(_){os.userInfo=()=>({username:process.env.USERNAME||'user',uid:-1,gid:-1,shell:process.env.ComSpec||'cmd.exe',homedir:process.env.USERPROFILE||process.cwd()});}
require('../node_modules/@capacitor/cli/bin/capacitor');

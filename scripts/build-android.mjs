import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const task=process.argv[2]||'assembleDebug';
const androidDir=resolve('android');
const wrapper=process.platform==='win32'?'gradlew.bat':'./gradlew';
const wrapperPath=resolve(androidDir,process.platform==='win32'?'gradlew.bat':'gradlew');
if(!existsSync(wrapperPath))throw new Error('Android Gradle wrapper is missing. Run capacitor sync first.');
const result=spawnSync(wrapper,[task],{cwd:androidDir,stdio:'inherit',shell:process.platform==='win32'});
if(result.error)throw result.error;
process.exit(result.status??1);

import { __set_ERPIntegration } from '../core/late-bindings';
// Lightweight integration guard. HR host adapter was removed in v32.4.60.
const ERPIntegration={
 hostMutationDepth:0,
 hostCall(fn){this.hostMutationDepth++;try{return fn()}finally{this.hostMutationDepth=Math.max(0,this.hostMutationDepth-1)}},
 syncThemes(){return true}
};
__set_ERPIntegration(ERPIntegration);
export { ERPIntegration };

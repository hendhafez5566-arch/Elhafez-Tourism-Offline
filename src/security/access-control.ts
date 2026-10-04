/* Permission facade for presentation/domain code: the only way outside security/bootstrap to ask can/require.
   Pure delegation - same arguments, same defaults, same thrown errors as Auth.can / Auth.require.
   Leaf module (no imports): security/auth.ts registers the real Auth on evaluation, so nothing changes in module evaluation order. */
interface AccessUser {id?:string;name?:string;role?:string;mustChangePassword?:boolean;onboardingSeen?:boolean;onboardingSeenAt?:string;permissions?:Record<string,unknown>;maxDiscountPct?:number;branchId?:string;allowedBranchIds?:string[]}
type Provider={user?:AccessUser;can(page:string,action?:string):boolean;require(page:string,action?:string):void};
let provider:Provider|null=null;
const AccessControl={
 bind(p:Provider){provider=p},
 /* live read of the signed-in user (Auth.user is reassigned on login/logout, so never cache it) */
 currentUser():AccessUser|undefined{return provider?.user},
 can(page:string,action:string='view'){return provider!.can(page,action)},
 require(page:string,action:string='view'){return provider!.require(page,action)}
};
export { AccessControl };

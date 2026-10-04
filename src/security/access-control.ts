/* Permission facade for presentation/domain code: the only way outside security/bootstrap to ask can/require.
   Pure delegation - same arguments, same defaults, same thrown errors as Auth.can / Auth.require.
   Leaf module (no imports): security/auth.ts registers the real Auth on evaluation, so nothing changes in module evaluation order. */
type Provider={user?:any;can(page:any,action?:any):any;require(page:any,action?:any):any};
let provider:Provider|null=null;
const AccessControl={
 bind(p:Provider){provider=p},
 /* live read of the signed-in user (Auth.user is reassigned on login/logout, so never cache it) */
 currentUser():any{return provider?.user},
 can(page:any,action:any='view'){return provider!.can(page,action)},
 require(page:any,action:any='view'){return provider!.require(page,action)}
};
export { AccessControl };

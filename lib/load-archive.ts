let pending:Promise<typeof import('./archive')>|undefined;
// Reuse concurrent requests without retaining a rejected application promise.
export function loadArchive(){
 pending??=import('./archive').catch(error=>{pending=undefined;throw error;});
 return pending;
}

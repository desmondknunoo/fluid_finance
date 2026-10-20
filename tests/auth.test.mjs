import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import React from 'react';
import { act, create } from 'react-test-renderer';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.window = { location: { origin: "https://finance.fluidterra.com" } };
globalThis.document = { title: "" };
const require = createRequire(import.meta.url);
const hasPage = existsSync('src/components/ui/auth-page.tsx');
const fixtures = {
    'firebase/auth': `const f=()=>globalThis.authFixture;
      export class GoogleAuthProvider {}
      export const onAuthStateChanged=(auth,fn)=>{f().listener=fn;fn(auth.currentUser);return()=>{f().listener=null;};};
      export const createUserWithEmailAndPassword=async()=>{f().creates++;if(f().creationError)throw f().creationError;const user=f().makeUser('new');f().auth.currentUser=user;f().listener?.(user);return{user};};
      export const updateProfile=async(user,patch)=>Object.assign(user,patch);
      export const sendEmailVerification=async()=>{f().verificationCalls++;return f().verification();};
      export const signOut=async()=>{f().auth.currentUser=null;f().listener?.(null);};
      export const sendPasswordResetEmail=async()=>{};
      export const signInWithEmailAndPassword=async()=>{};
      export const signInWithPopup=async()=>{const user=f().makeUser('google');f().auth.currentUser=user;f().listener?.(user);return{user};};`,
    '@/lib/firebase': `export const firebaseConfigured=true;export const getFirebaseAuth=()=>globalThis.authFixture.auth;`,
    '@/lib/api': `export class ApiError extends Error {constructor(message,status,code){super(message);this.status=status;this.code=code;}}`,
    '@/lib/community': `export const getMyProfile=()=>globalThis.authFixture.readProfile();export const updateOwnProfile=(id,patch)=>globalThis.authFixture.updateProfile(id,patch);`,
    '@/lib/navigation': `export const returnAfterAuth=()=>{globalThis.authFixture.redirects++;};`,
    '@/components/ui/form': `import React from 'react';export const panelClass='panel';export const Notice=({children})=>React.createElement('p',null,children);export const PrimaryButton=({loading,...props})=>React.createElement('button',{...props,disabled:loading||props.disabled});export const SecondaryButton=props=>React.createElement('button',props);export const TextField=props=>React.createElement('input',props);`,
    'lucide-react': `export const ArrowRight=()=>null;export const CheckCircle2=()=>null;`,
};
const bundle=await build({stdin:{contents:`export {AuthProvider,useAuth} from './src/lib/auth.tsx';${hasPage?"export {default as AuthPage} from './src/components/ui/auth-page.tsx';":''}`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'esm',platform:'node',jsx:'automatic',plugins:[{name:'dependencies',setup(b){
    b.onResolve({filter:/^(react|react\/jsx-runtime)$/},args=>({path:pathToFileURL(require.resolve(args.path)).href,external:true}));
    b.onResolve({filter:/^@\/lib\/auth$/},()=>({path:path.resolve('src/lib/auth.tsx')}));
    b.onResolve({filter:/.*/},args=>fixtures[args.path]?{path:args.path,namespace:'fixture'}:null);
    b.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:fixtures[args.path]}));
}}]});
const {AuthProvider,useAuth,AuthPage}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return{promise,resolve,reject};};
function fixture(){
    const f={auth:{currentUser:null},listener:null,creates:0,redirects:0,verificationCalls:0,verification:async()=>{},makeUser(id){return{uid:id,email:`${id}@example.com`,emailVerified:false,displayName:id,photoURL:null,reload:async()=>{},getIdToken:async()=> 'token'};},readProfile:async()=>({id:f.auth.currentUser.uid,username:'generated',role:'member',display_name:'New',bio:null,avatar_url:null}),updateProfile:async(id,patch)=>({id,role:'member',...patch})};
    globalThis.authFixture=f;return f;
}
async function mounted(f,page=false){let latest,root;function Probe(){latest=useAuth();return null;}
    await act(async()=>{root=create(React.createElement(AuthProvider,null,React.createElement(Probe),page?React.createElement(AuthPage,{mode:'register'}):null));});
    return{get latest(){return latest;},get root(){return root;},async close(){await act(async()=>root.unmount());}};
}
async function fillRegistration(view){await act(async()=>{for(const [label,value]of[['Email address','new@example.com'],['Password','password123'],['Display name','New Reader'],['Username','newreader']])view.root.root.findAllByType('input').find(n=>n.props.label===label).props.onChange({target:{value}});});}

test('late profile success cannot restore a signed-out session',async()=>{const f=fixture(),pending=deferred();f.auth.currentUser=f.makeUser('first');f.readProfile=()=>pending.promise;const v=await mounted(f);try{await act(async()=>v.latest.signOut());await act(async()=>pending.resolve({id:'first',role:'admin'}));assert.equal(v.latest.user,null);assert.equal(v.latest.profile,null);assert.equal(v.latest.loading,false);}finally{await v.close();}});

test('late errors from an old account cannot erase the newly signed-in profile',async()=>{const f=fixture(),pending=deferred();f.auth.currentUser=f.makeUser('first');f.readProfile=()=>f.auth.currentUser.uid==='first'?pending.promise:Promise.resolve({id:'second',role:'member'});const v=await mounted(f);try{await act(async()=>{f.auth.currentUser=f.makeUser('second');f.listener(f.auth.currentUser);});await act(async()=>pending.reject(Error('old account failed')));assert.equal(v.latest.user.id,'second');assert.equal(v.latest.profile.id,'second');assert.equal(v.latest.profileError,null);}finally{await v.close();}});

test('signup stays on the form until setup finishes, then shows verification instructions',{skip:!hasPage},async()=>{const f=fixture(),pending=deferred();f.verification=()=>pending.promise;const v=await mounted(f,true);let submitted;try{await fillRegistration(v);await act(async()=>{submitted=v.root.root.findByType('form').props.onSubmit({preventDefault(){}});await Promise.resolve();});assert.equal(f.redirects,0);assert.equal(v.root.root.findAllByType('form').length,1);await act(async()=>{pending.resolve();await submitted;});assert.equal(f.redirects,0);assert.match(JSON.stringify(v.root.toJSON()),/Account created/);assert.match(JSON.stringify(v.root.toJSON()),/Check your inbox/);assert.equal(f.creates,1);}finally{await v.close();}});

test('profile setup failure cannot prevent verification email or misreport account creation',async()=>{const f=fixture();f.readProfile=async()=>{throw Error('API down');};const v=await mounted(f);try{let result;await act(async()=>{result=await v.latest.signUp({email:'new@example.com',password:'password123',username:'newreader',displayName:'New Reader'});});assert.equal(f.verificationCalls,1);assert.equal(result.verificationSent,true);assert.match(result.warnings.join(' '),/account was created.*profile setup/i);assert.equal(f.creates,1);}finally{await v.close();}});

test('verification send failure reports a created account with a resend recovery',async()=>{const f=fixture();f.verification=async()=>{throw Error('rate limited');};const v=await mounted(f);try{let result;await act(async()=>{result=await v.latest.signUp({email:'new@example.com',password:'password123',username:'newreader',displayName:'New Reader'});});assert.equal(result.verificationSent,false);assert.match(result.warnings.join(' '),/Resend it from Account settings/);assert.equal(f.creates,1);}finally{await v.close();}});


test('finishing signup releases loading even when the first profile request is still pending',async()=>{const f=fixture(),pending=deferred();let reads=0;f.readProfile=()=>++reads===1?pending.promise:Promise.resolve({id:'new',role:'member',username:'newreader'});const v=await mounted(f);try{await act(async()=>{await v.latest.signUp({email:'new@example.com',password:'password123',username:'newreader',displayName:'New Reader'});});assert.equal(v.latest.loading,false);assert.equal(v.latest.profile.username,'newreader');await act(async()=>pending.resolve({id:'new',username:'old-generated'}));assert.equal(v.latest.profile.username,'newreader');}finally{await v.close();}});


test('Google sign-in returns to the requested page exactly once',{skip:!hasPage},async()=>{const f=fixture();const v=await mounted(f,true);try{await act(async()=>{v.root.root.findAllByType('button')[0].props.onClick();});assert.equal(f.redirects,1);assert.equal(v.latest.user.id,'google');assert.equal(v.latest.loading,false);}finally{await v.close();}});

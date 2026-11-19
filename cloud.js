import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, query, orderBy, serverTimestamp, runTransaction } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const configured = firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.projectId !== "YOUR_PROJECT_ID";
let app, auth, db;
if (configured) { app=initializeApp(firebaseConfig); auth=getAuth(app); db=getFirestore(app); }
export const cloudReady = configured;
export const authState = callback => configured ? onAuthStateChanged(auth, callback) : callback(null);
export const register = (email,password) => { if(!configured) throw new Error("请先配置 Firebase"); return createUserWithEmailAndPassword(auth,email,password); };
export const login = (email,password) => { if(!configured) throw new Error("请先配置 Firebase"); return signInWithEmailAndPassword(auth,email,password); };
export const logout = () => configured ? signOut(auth) : Promise.resolve();

export async function createTeam(name) {
  if(!configured || !auth.currentUser) throw new Error("请先登录");
  const teamRef=doc(collection(db,"teams")), uid=auth.currentUser.uid;
  const memberRef=doc(db,"teams",teamRef.id,"members",uid);
  await runTransaction(db,async tx=>{
    tx.set(teamRef,{name:name.trim(),ownerUid:uid,createdAt:serverTimestamp()});
    tx.set(memberRef,{uid,email:auth.currentUser.email||"",role:"owner",joinedAt:serverTimestamp()});
  });
  return teamRef.id;
}
export async function addScore(teamId,personId,delta,note="") {
  if(!configured || !auth.currentUser) throw new Error("请先登录");
  if(!Number.isInteger(delta)||delta===0||Math.abs(delta)>99999) throw new Error("积分数值无效");
  const memberRef=doc(db,"teams",teamId,"members",auth.currentUser.uid);
  const ledgerRef=doc(collection(db,"teams",teamId,"ledger"));
  await runTransaction(db,async tx=>{
    const member=await tx.get(memberRef);
    if(!member.exists()||!["owner","admin"].includes(member.data().role)) throw new Error("没有积分管理权限");
    tx.set(ledgerRef,{personId,delta,note:String(note).slice(0,120),actorUid:auth.currentUser.uid,createdAt:serverTimestamp()});
  });
  return ledgerRef.id;
}
export async function readTeam(teamId) {
  if(!configured || !auth.currentUser) throw new Error("请先登录");
  const member=await getDoc(doc(db,"teams",teamId,"members",auth.currentUser.uid));
  if(!member.exists()) throw new Error("你不是这个团队的成员");
  const [team,people,ledger]=await Promise.all([
    getDoc(doc(db,"teams",teamId)),
    getDocs(collection(db,"teams",teamId,"people")),
    getDocs(query(collection(db,"teams",teamId,"ledger"),orderBy("createdAt","desc")))
  ]);
  return {team:team.data(),people:people.docs.map(x=>({id:x.id,...x.data()})),ledger:ledger.docs.map(x=>({id:x.id,...x.data()}))};
}

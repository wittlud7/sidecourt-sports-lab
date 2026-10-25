'use client';
import {Component,Suspense,type ReactNode} from 'react';
import {Loading} from './sports-ui';

class ModuleBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className="notice" role="alert">页面暂时无法载入。<button className="text-link" onClick={()=>window.location.reload()}>重新载入</button></div>:this.props.children;}
}
export default function AsyncPanel({children}:{children:ReactNode}){
 return <ModuleBoundary><Suspense fallback={<Loading/>}>{children}</Suspense></ModuleBoundary>;
}

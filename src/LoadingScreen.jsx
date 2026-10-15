import React from 'react';

export default function LoadingScreen(){
 return <div className="befun-loader befun-loader--page" role="status" aria-label="불러오는 중">
  <div className="befun-loader__identity" aria-hidden="true">
   <img className="befun-loader__logo" src="/assets/logo-black.svg?v=supplied-1" alt="" width="128" height="39"/>
   <span className="befun-loader__line"/>
  </div>
 </div>;
}

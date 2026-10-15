import test from 'node:test';
import assert from 'node:assert/strict';
import templates from '../src/data/configurator-templates.json' with {type:'json'};
import {calculatePrice,sumCatalogArticles} from '../src/pricing.js';

const base={width:227,height:81,depth:40,style:'Unilateral',frame:'Chrome',legs:'Legs',handle:'Hole',color:'#000000',defaultType:'Open with back/side panel',cells:{}};
const price=patch=>calculatePrice({...base,...patch});

test('initial 3×2 furniture matches the observed CHF 1152 with each physical shared part counted once',()=>{
 const result=price({});
 assert.equal(result.gross,1152);assert.equal(result.net,864);assert.equal(result.estimated,false);
 const counts=Object.fromEntries(result.articles.map(a=>[a.sku,a.count]));
 assert.equal(counts['1050010100601'],18);assert.equal(counts['1050010200600'],16);
 assert.equal(counts['1050020100610'],12);assert.equal(counts['1050020200610'],12);
 assert.equal(counts['1050030100607'],15);assert.equal(counts['1050030100606'],8);
});

test('independently generated mixed-height drawer bills match captured public container fixtures',()=>{
 for(const [frame,gross] of [['Chrome',583.5],['Black',785.5]]){
  const result=price({width:40,height:63,columnWidths:[41],rowHeights:[41,20],color:'#ffffff',frame,defaultType:'Drawer'});
  assert.equal(result.gross,gross);assert.equal(result.estimated,false,result.reason);
 }
});

test('a complete 2×2 flap layout matches saved fixture and handle change adds only actual catalogue difference',()=>{
 const result=price({width:152,color:'#ffffff',handle:'Handle',defaultType:'Flap down'});
 assert.equal(result.gross,1517);assert.equal(result.estimated,false,result.reason);
 assert.equal(price({width:152,color:'#ffffff',handle:'Hole',defaultType:'Flap down'}).gross,1501);
 const low=price({width:152,height:43,color:'#c5c4c0',defaultType:'Flap down'});
 assert.equal(low.gross,845);assert.equal(low.estimated,false,low.reason);
});

test('width/height and castor changes alter actual frame and safety part counts',()=>{
 const small=price({width:152,height:43});
 assert.ok(small.gross<1152);
 assert.equal(small.articles.some(a=>a.sku==='1050200001100'),false);
 const castors=price({legs:'Castors'});
 assert.equal(castors.articles.find(a=>a.sku==='1050090001610').count,4);
 assert.equal(castors.articles.some(a=>a.sku==='1050200001100'),false);
 assert.equal(castors.gross,1190.5);
});

test('all 54 captured preset BOMs are checked; missing legacy SKUs remain explicitly incomplete',()=>{
 const expectedMissing={
  'garderobe-5':['1050320500001','1050320500002'],
  'ecksideboard-1':['1050320800002'],
  'ecksideboard-4':['1050320700002']
 };
 let exact=0;
 for(const template of templates){
  const result=sumCatalogArticles(template.articles);
  if(expectedMissing[template.id]){
   assert.equal(result.estimated,true);assert.deepEqual(result.missing.sort(),expectedMissing[template.id].sort());
   assert.ok(result.gross<template.price);
  } else {assert.equal(result.gross,template.price,template.id);assert.equal(result.estimated,false);exact++;}
  const snapshot=price({referencePrice:template.price});assert.equal(snapshot.gross,template.price);assert.equal(snapshot.source,'reference');
 }
 assert.equal(templates.length,54);assert.equal(exact,51);
});

test('unsupported corner, bilateral, custom colour and mechanism dimensions are estimates',()=>{
 for(const patch of [{style:'Corner'},{style:'Double'},{color:'#f85e23'},{depth:20,defaultType:'Drawer'},{height:63,defaultType:'Flap down'}]){
  const result=price(patch);assert.equal(result.estimated,true);assert.ok(result.reason);assert.ok(Number.isFinite(result.gross)&&result.gross>0);
 }
 assert.equal(price({color:'#f85e23'}).gross,1497.6);
});

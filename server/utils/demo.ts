import type { Catalog } from '../../types/music'
const image = (seed: string) => 'https://images.unsplash.com/' + seed + '?auto=format&fit=crop&w=600&q=75'
// Registros ficticios. Las URLs de audio pueden ser añadidas desde fuentes autorizadas.
export const demoCatalog: Catalog = {
 artists: [
  { id:'a1',name:'Aurora Norte',slug:'aurora-norte',description:'Paisajes sonoros y melodías para perderse en el horizonte.',cover:image('photo-1516280440614-37939bbacd81'),accent:'#a17aff' },
  { id:'a2',name:'Horizonte Azul',slug:'horizonte-azul',description:'Una mezcla de sonidos atmosféricos y ritmos modernos.',cover:image('photo-1493225457124-a3eb161ffa5f'),accent:'#49b4bd' },
  { id:'a3',name:'Luna Eléctrica',slug:'luna-electrica',description:'Exploraciones electrónicas con energía nocturna.',cover:image('photo-1506157786151-b8491531f063'),accent:'#f47f9b' },
  { id:'a4',name:'Ritmo Andino',slug:'ritmo-andino',description:'Inspiración contemporánea en las raíces de los Andes.',cover:image('photo-1524368535928-5b5e00ddc76b'),accent:'#e4ad65' }
 ],
 albums: [
  {id:'b1',title:'Luces de Medianoche',slug:'luces-de-medianoche',artistId:'a1',year:2026,cover:image('photo-1470225620780-dba8ba36b745')},
  {id:'b2',title:'Cielo Infinito',slug:'cielo-infinito',artistId:'a2',year:2025,cover:image('photo-1459749411175-04bf5292ceea')},
  {id:'b3',title:'Frecuencia',slug:'frecuencia',artistId:'a3',year:2026,cover:image('photo-1571266028243-d220c9ad6d6d')},
  {id:'b4',title:'Raíces del Sol',slug:'raices-del-sol',artistId:'a4',year:2024,cover:image('photo-1514525253161-7a46d19cd819')}
 ],
 tracks: [
  {id:'t1',title:'Un nuevo amanecer',slug:'un-nuevo-amanecer',artistId:'a1',albumId:'b1',duration:218,audioUrl:'',cover:'',plays:1580},
  {id:'t2',title:'Constelaciones',slug:'constelaciones',artistId:'a1',albumId:'b1',duration:242,audioUrl:'',cover:'',plays:1320},
  {id:'t3',title:'Kilómetros de cielo',slug:'kilometros-de-cielo',artistId:'a2',albumId:'b2',duration:196,audioUrl:'',cover:'',plays:1100},
  {id:'t4',title:'Olas de cristal',slug:'olas-de-cristal',artistId:'a2',albumId:'b2',duration:204,audioUrl:'',cover:'',plays:990},
  {id:'t5',title:'Neón',slug:'neon',artistId:'a3',albumId:'b3',duration:189,audioUrl:'',cover:'',plays:1750},
  {id:'t6',title:'Después de las dos',slug:'despues-de-las-dos',artistId:'a3',albumId:'b3',duration:232,audioUrl:'',cover:'',plays:720},
  {id:'t7',title:'Viento del altiplano',slug:'viento-del-altiplano',artistId:'a4',albumId:'b4',duration:256,audioUrl:'',cover:'',plays:2030},
  {id:'t8',title:'Senderos',slug:'senderos',artistId:'a4',albumId:'b4',duration:221,audioUrl:'',cover:'',plays:850}
 ]
}

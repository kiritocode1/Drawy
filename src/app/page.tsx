"use client";
import { useState } from 'react';
import { Excalidraw, exportToBlob, serializeAsJSON } from '@excalidraw/excalidraw';
import * as fal from "@fal-ai/serverless-client";
import Image from 'next/image';
import { FC } from 'react'

interface pageProps {
  
}

fal.config({
  proxyUrl: "/api/fal/proxy"
})
const seed = Math.floor(Math.random() * 10000);
const baseArgs = {
  sync_mode: true,
  strength: .99,
  seed
};



const Home: FC<pageProps> = ({ }) => {

  //input for user to type into 
  const [input, setInput] = useState<string>("cinematic shot of  superman standing heroicly in front of the sun");
  //image gets updated once a new image comes in from fal api
  const [image, setImage] = useState(null);
  //for excalidraw
  const [scenedata, setScenedata] = useState<any>(null);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [_appState, setAppState] = useState<any>(null);

  const {send} = fal.realtime.connect("110602490-sdxl-turbo-realtime", {
    connectionKey: "realtime-nextjs-app-1", 
    onResult (result) {
      if (result.error) return;
      setImage(result.images[0].url);

    }
  });

  async function getDataUrl (appState = _appState) {
    
    const elements = excalidrawAPI.getSceneElements();
    if (!elements || !elements.length) return;
    const blob = await  exportToBlob({
      elements, 
      exportPadding: 0, 
      appState, 
      quality: 0.5, 
      files: excalidrawAPI.getFiles(),
      getDimensions:()=>{ return {width: 450, height: 450}}
    })
    //@ts-ignore
    return await new Promise((r) => {
			let a = new FileReader();
			a.onload = r;
			a.readAsDataURL(blob);
			//@ts-ignore
		}).then((e) => e.target.result);
    
  }




  return (<div className='p-10'>
    <div className="textxl"> @ Aryan Kathawale </div>
    <input className='border rounded-lg p-2 w-full mb-2 text-black'
      value={input}
      onChange={async(e) => {
        setInput(e.target.value);
        let dataUrl = await getDataUrl();
        send({
          ...baseArgs, 
          image_url: dataUrl, 
          prompt: e.target.value
        })
      }} />
    

    <div className="flex">
      <div className="w-[550px] h-[570px]">
        <Excalidraw
          excalidrawAPI={(API) => setExcalidrawAPI(API)}
          onChange={async (element, appState) => {
            const newSceneData = await serializeAsJSON(element,
              appState, excalidrawAPI.getFiles(), 'local');
            
            if (newSceneData !== scenedata) {
              setAppState(appState);
              setScenedata(newSceneData);
              let dataUrl = await getDataUrl(appState);
              send({
                ...baseArgs, 
                image_url: dataUrl, 
                prompt: input
              })
            }
          }}
        
        />
      </div>
      {image && <Image src={image} width={550} height={550} alt="wow ai is soo cool , fal ai responce" />}
    </div>
  </div>)
}

export default Home
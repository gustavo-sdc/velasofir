import { useState } from 'react'
import logoPreto from './assets/ofir-logo-white-bg.png'

function App() {

  return (
    <>
      <img src="" alt="" />
      <div className='flex flex-col items-center w-screen h-screen justify-center gap-4'>
        <img src={logoPreto} alt="logo-ofir." className='w-40' />
        <h1 className='text-3xl font-quintessential font-light'><span className='font-medium'>15.10</span> - Lançamento oficial</h1>
        <a href="https://www.instagram.com/velasofir/" target="_blank" rel="noopener noreferrer" className='text-xl font-quintessential font-light underline italic'>Instagram</a>
      </div>
    </>
  )
}

export default App

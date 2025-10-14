import logoPreto from './assets/ofir-logo-white-bg.png'

function App() {

  return (
    <>
      <div className='flex flex-col items-center w-screen h-screen justify-center gap-4'>
        <img src={logoPreto} alt="logo-ofir." className='w-40' />
        <h1 className='text-3xl font-quintessential font-light'><span className='font-bold'>15.10</span> - Lançamento oficial</h1>
        <a href="https://www.instagram.com/velasofir/" target="_blank" rel="noopener noreferrer" className='text-xl font-quintessential font-light underline italic'>Instagram</a>
      </div>
    </>
  )
}

export default App

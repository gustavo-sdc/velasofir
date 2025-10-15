export default function Button(variant: 'primary' | 'secondary', children: React.ReactNode) {

    const type = {
        primary: 'bg-black text-white',
        secondary: 'bg-white text-black',
    }
    
    return(
        <button className={`${type[variant]} p-2 rounded rounded-xl transform hover:scale-105 transition duration-300 ease-in-out`}>
            {children}
        </button>
    )
}
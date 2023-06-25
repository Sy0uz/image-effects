import React from 'react'
import s from './Header.module.scss'

const Header = () => {
    return (
        <header className={s.wrapper}>
            <h1 className={s.title}>
                Image Effect
            </h1>
        </header>
    )
}

export default Header
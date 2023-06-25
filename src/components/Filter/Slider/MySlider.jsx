import React from 'react'
import s from './Slider.module.scss'
import { Slider } from 'antd'

const MySlider = ({ value, setValue, title, minValue = -255, maxValue = 255, step = 1 }) => {
    return (
        <div className={s.sliderBox}>
            <div className={s.slider}>
                <div>{minValue}</div>
                <Slider min={minValue} max={maxValue} step={step} value={value} onChange={(value) => setValue(value)} />
                <div>{maxValue}</div>
            </div>
            <div className={s.sliderTitle}>{title}</div>
        </div>
    )
}

export default MySlider
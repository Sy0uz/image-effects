import React from 'react'
import s from './Filter.module.scss'
import { Button } from 'antd';
import MySlider from './Slider/MySlider';

const Filter = ({ processImage, getImageData, original, brightness, setBrightness, saturationValue, setSaturationValue, gammaValue, setGamma }) => {

    const applyFilter = async (type) => {
        processImage(getImageData(original), type);
    }

    const reset = () => {
        processImage(getImageData(original));
    }

    return (
        <div className={s.wrapper}>

            <div className={s.effectType}>
                <div>Отразить по</div>
                <div className={s.buttonGroup}>
                    <Button onClick={() => applyFilter('horizontal')}>Горизонтали</Button>
                    <Button onClick={() => applyFilter('vertical')}>Вертикали</Button>
                </div>
            </div>

            <div className={s.effectType}>
                <div>Простая трансформация</div>
                <div className={s.buttonGroup}>
                    <Button onClick={() => applyFilter('blackandwhite')}>Обесцветить</Button>
                    <Button onClick={() => applyFilter('inverse')}>Инвертировать</Button>
                    <Button onClick={() => applyFilter('strong')}>Резкость</Button>
                    <Button onClick={() => applyFilter('blur')}>Размыть</Button>
                </div>
            </div>

            <div className={s.effectType}>
                <div>Коррекция</div>

                <MySlider title='Яркость' value={brightness} setValue={setBrightness} />
                <MySlider title='Насыщенность' value={saturationValue} setValue={setSaturationValue} />
                <MySlider title='Гамма' value={gammaValue} setValue={setGamma} minValue={0.1} maxValue={6} step={0.1} />
            </div>

            <Button onClick={() => reset()}>Сбросить</Button>

        </div >
    )
}

export default React.memo(Filter);
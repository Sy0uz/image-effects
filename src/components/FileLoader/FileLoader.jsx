import React, { useEffect, useRef, useState } from 'react'
import s from './FileLoader.module.scss'
import Filter from '../Filter/Filter';
import { Button, Checkbox } from 'antd';
import { getSize } from '../../utils/getSize';

const FileLoader = () => {
    const ref = useRef();
    const canvasRef = useRef();

    const [photo, setPhoto] = useState({
        url: '',
        file: null,
        width: 0,
        height: 0,
    });

    const [brightness, setBrightness] = useState(0);
    const [saturationValue, setSaturationValue] = useState(0);
    const [original, setOriginal] = useState(false);
    const [gamma, setGamma] = useState(1);

    const [previos, setPrevios] = useState([]);

    useEffect(() => {
        if (photo.file) {
            setTimeout(() => {
                processImage(getImageData(ref.current))
            }, 10)
        }
    }, [photo])

    useEffect(() => {
        if (photo.file)
            processImage(getImageData(ref.current), 'effect')
    }, [brightness, saturationValue, gamma])

    const clickToDownload = () => {
        const link = document.createElement('a');
        link.setAttribute('href', canvasRef.current.toDataURL('image/png'));
        link.setAttribute('download', 'Результат.png');
        link.click();
        return false;
    }

    const changePhoto = async (file) => {
        if (file) {
            const sizes = await getSize(URL.createObjectURL(file));
            setPhoto({ url: URL.createObjectURL(file), file: file, width: sizes[0], height: sizes[1] });
        }
        else {
            setPhoto({
                url: '',
                file: null,
                width: 0,
                height: 0,
            });
        }
    }

    const savePalette = (dst) => {
        setPrevios(dst);
        setBrightness(0);
        setSaturationValue(0);
        setGamma(1);
    }

    const makePowArr = (gamma) => {
        let level = 1 / (gamma);
        let pow = [];
        for (let i = 0; i < 256; i++) {
            let value = (255 * Math.pow(i / 255.0, level) + 0.5);
            if (value > 255) value = 255;
            else if (value < 0) value = 0;
            else value = Math.floor(value);
            pow.push(value);
        }
        return pow;
    }

    const processCanvas = async (func) => {
        const canvas = canvasRef.current;
        canvas.width = photo.width;
        canvas.height = photo.height;

        const ctx = canvas.getContext('2d');
        const outImg = ctx.createImageData(photo.width, photo.height);

        const dst = new Uint32Array(outImg.data.buffer);

        func(dst);

        ctx.putImageData(outImg, 0, 0)
    }

    const getImageData = (imageRef) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const img = imageRef;
        canvas.width = photo.width
        canvas.height = photo.height
        context.drawImage(img, 0, 0);
        return context.getImageData(0, 0, photo.width, photo.height);
    }

    const processImage = async (inImg, type = '') => {
        const src = new Uint32Array(inImg.data.buffer);

        switch (type) {
            case 'horizontal':
                const horizontal = (dst) => {
                    savePalette(dst);
                    for (let y = 0; y < photo.height; y++) {
                        for (let x = 0; x < photo.width; x++) {
                            dst[y * photo.width + x] = previos[y * photo.width + (photo.width - x - 1)];
                        }
                    }
                }
                processCanvas(horizontal);
                break;
            case 'vertical':
                const vertical = (dst) => {
                    savePalette(dst);
                    for (let y = 0; y < photo.height; y++) {
                        for (let x = 0; x < photo.width; x++) {
                            dst[y * photo.width + x] = previos[(photo.height - y - 1) * photo.width + x];
                        }
                    }
                }
                processCanvas(vertical);
                break;
            case 'blackandwhite':
                const blackandwhite = (dst) => {
                    savePalette(dst);
                    for (let i = 0; i < dst.length; i++) {
                        let r = previos[i] & 0xFF;
                        let g = (previos[i] >> 8) & 0xFF;
                        let b = (previos[i] >> 16) & 0xFF;
                        let gray = (r * 0.3 + g * 0.59 + b * 0.11);
                        dst[i] = (previos[i] & 0xFF000000) | (gray << 16) | (gray << 8) | gray;
                    }
                }
                processCanvas(blackandwhite)
                break;
            case 'inverse':
                const inverse = (dst) => {
                    savePalette(dst);
                    for (let i = 0; i < dst.length; i++) {
                        let r = previos[i] & 0xFF;
                        let g = (previos[i] >> 8) & 0xFF;
                        let b = (previos[i] >> 16) & 0xFF;

                        r = 255 - r;
                        g = 255 - g;
                        b = 255 - b;

                        dst[i] = (previos[i] & 0xFF000000) | (b << 16) | (g << 8) | r;
                    }
                }
                processCanvas(inverse)
                break;
            case 'effect':
                const effect = (dst) => {

                    const pow = makePowArr(gamma);

                    for (let i = 0; i < dst.length; i++) {
                        let r = previos[i] & 0xFF;
                        let g = (previos[i] >> 8) & 0xFF;
                        let b = (previos[i] >> 16) & 0xFF;

                        //гамма
                        r = pow[r];
                        g = pow[g];
                        b = pow[b];

                        //яркость
                        r += brightness;
                        g += brightness;
                        b += brightness;

                        //насыщенность
                        let gray = (r * 0.2126 + g * 0.7152 + b * 0.0722);
                        r += (r - gray) * saturationValue / 255;
                        g += (g - gray) * saturationValue / 255;
                        b += (b - gray) * saturationValue / 255;

                        if (r > 255) r = 255;
                        else if (r < 0) r = 0;
                        if (g > 255) g = 255;
                        else if (g < 0) g = 0;
                        if (b > 255) b = 255;
                        else if (b < 0) b = 0;

                        dst[i] = (previos[i] & 0xFF000000) | (b << 16) | (g << 8) | r;
                    }
                }
                processCanvas(effect)
                break;
            case 'blur':
                const blur = (dst) => {
                    savePalette(dst);
                    let dstIndex = 0;
                    let blurSize = 4;
                    for (let y = 0; y < photo.height; y++) {
                        for (let x = 0; x < photo.width; x++) {
                            let a = 0, r = 0, g = 0, b = 0, count = 0;
                            for (let sy = y - blurSize; sy <= y + blurSize; sy++) {
                                const yy = Math.min(photo.height - 1, Math.max(0, sy));
                                for (let sx = x - blurSize; sx <= x + blurSize; sx++) {
                                    const xx = Math.min(photo.width - 1, Math.max(0, sx));
                                    let pix = previos[yy * photo.width + xx];
                                    r += pix & 0xFF;
                                    g += (pix >> 8) & 0xFF;
                                    b += (pix >> 16) & 0xFF;
                                    a += (pix >> 24) & 0xFF;
                                    count++;
                                }
                            }

                            a = (a / count) & 0xFF;
                            r = (r / count) & 0xFF;
                            g = (g / count) & 0xFF;
                            b = (b / count) & 0xFF;

                            dst[dstIndex++] = (a << 24) | (b << 16) | (g << 8) | r;
                        }
                    }
                }
                processCanvas(blur)
                break;
            case 'strong':
                const strong = (dst) => {
                    savePalette(dst);
                    const kernelSize = 3;
                    const halfSize = Math.floor(kernelSize / 2);
                    let kernel = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]];
                    let div = 1;
                    let offset = 0;

                    let dstIndex = 0;
                    for (let y = 0; y < photo.height; y++) {
                        for (let x = 0; x < photo.width; x++) {
                            let r = 0, g = 0, b = 0;
                            for (let sy = 0; sy < kernelSize; sy++) {
                                const yy = Math.min(photo.height - 1, Math.max(0, y + sy - halfSize));
                                for (let sx = 0; sx < kernelSize; sx++) {
                                    const xx = Math.min(photo.width - 1, Math.max(0, x + sx - halfSize));
                                    let pix = previos[yy * photo.width + xx];
                                    r += (pix & 0xFF) * kernel[sy][sx];
                                    g += ((pix >> 8) & 0xFF) * kernel[sy][sx];
                                    b += ((pix >> 16) & 0xFF) * kernel[sy][sx];
                                }
                            }

                            const a = previos[y * photo.width + x] & 0xFF000000;
                            r = Math.min(255, Math.max(0, offset + (r / div))) & 0xFF;
                            g = Math.min(255, Math.max(0, offset + (g / div))) & 0xFF;
                            b = Math.min(255, Math.max(0, offset + (b / div))) & 0xFF;

                            dst[dstIndex++] = a | (b << 16) | (g << 8) | r;
                        }
                    }
                }
                processCanvas(strong)
                break;
            default:
                const copy = (dst) => {
                    savePalette(dst);
                    for (let i = 0; i < dst.length; i++) {
                        dst[i] = src[i];
                    }
                }
                processCanvas(copy);
                break;
        }
    }

    return (
        <div className={s.wrapper}>
            <input className={s.upload} type="file" name="Photo" id="" onChange={e => changePhoto(e.target.files[0])} />
            {
                photo.file
                    ?
                    <>
                        <div className={s.fixedBlock}>
                            <Checkbox onChange={e => setOriginal(e.target.checked)}>Показать оригинал</Checkbox>
                        </div>
                        <img ref={ref} src={photo.url} alt="" className={original ? [s.preview, s.active].join(' ') : s.preview} />
                        <canvas className={original ? [s.canvas, s.closed].join(' ') : s.canvas} ref={canvasRef}></canvas>

                        <Filter
                            processImage={processImage}
                            getImageData={getImageData}
                            original={ref.current}
                            brightness={brightness}
                            setBrightness={setBrightness}
                            saturationValue={saturationValue}
                            setSaturationValue={setSaturationValue}
                            gammaValue={gamma}
                            setGamma={setGamma}
                        />
                        <Button onClick={() => clickToDownload()}>Скачать</Button>
                    </>

                    :
                    <><h3>Загрузите файл для начала работы</h3></>
            }
        </div>
    )
}

export default FileLoader
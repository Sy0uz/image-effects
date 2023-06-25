const getMeta = (url) => {
    return new Promise((res, rej) => {
        let img = new Image();
        img.onload = () => res(img);
        img.onerror = () => rej();
        img.src = url;
    })
}

export const getSize = async (url) => {
    let img = await getMeta(url);

    return [img.width, img.height];
}
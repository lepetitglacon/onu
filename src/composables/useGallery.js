const gallery = Object.values(import.meta.glob('@assets/cards/*.{png,jpg,jpeg,PNG,JPEG}', { eager: true, as: 'url' }))

export function useGallery() {
    return gallery
}
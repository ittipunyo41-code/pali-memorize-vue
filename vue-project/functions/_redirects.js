import { getAssetFromKV } from '@cloudflare/kv-asset-handler'

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

async function handleEvent(event) {
  const url = new URL(event.request.url)
  
  // Handle static assets
  if (url.pathname.startsWith('/assets/')) {
    try {
      return await getAssetFromKV(event, {
        ASSET_NAMESPACE: __STATIC_CONTENT__,
        ASSET_KEY: __STATIC_CONTENT_KEY__,
      })
    } catch (e) {
      return new Response('Not Found', { status: 404 })
    }
  }

  // Handle HTML files
  if (url.pathname.endsWith('.html') || url.pathname === '/') {
    try {
      const asset = await getAssetFromKV(event, {
        ASSET_NAMESPACE: __STATIC_CONTENT__,
        ASSET_KEY: __STATIC_CONTENT_KEY__,
      })
      
      // Add security headers
      const response = new Response(asset.body, asset)
      response.headers.set('X-Frame-Options', 'DENY')
      response.headers.set('X-Content-Type-Options', 'nosniff')
      response.headers.set('X-XSS-Protection', '1; mode=block')
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
      response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
      
      // Cache control
      if (url.pathname === '/index.html') {
        response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
      } else {
        response.headers.set('Cache-Control', 'public, max-age=86400')
      }
      
      return response
    } catch (e) {
      return new Response('Not Found', { status: 404 })
    }
  }

  // Handle API routes if any
  if (url.pathname.startsWith('/api/')) {
    return new Response('API not implemented', { status: 501 })
  }

  // Fallback to index.html for client-side routing
  try {
    const asset = await getAssetFromKV(event, {
      ASSET_NAMESPACE: __STATIC_CONTENT__,
      ASSET_KEY: __STATIC_CONTENT_KEY__,
    })
    
    const response = new Response(asset.body, asset)
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    return response
  } catch (e) {
    return new Response('Not Found', { status: 404 })
  }
}
import fs from 'fs/promises'
import path from 'path'


export async function getLatestArticlePath(): Promise<string> {
    // this is to get the latest article in path
    // move this to a service as I need it for registerArticle and writetoFc
    const articlesDir = 'articles'
    try {
        const files = await fs.readdir(articlesDir)
        if (files.length === 0) {
            throw new Error('No articles found in the articles directory')
        }
        
        // Get the most recently created file
        const filePaths = files.map(file => path.join(articlesDir, file))
        const fileStats = await Promise.all(
            filePaths.map(async filePath => ({
                path: filePath,
                stat: await fs.stat(filePath)
            }))
        )
        
        const latestFile = fileStats.reduce((latest, current) => {
            return latest.stat.mtime > current.stat.mtime ? latest : current
        })
        
        return latestFile.path
    } catch (error) {
        throw new Error(`Failed to get latest article: ${error}`)
    }
}
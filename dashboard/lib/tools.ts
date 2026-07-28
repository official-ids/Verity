import fs from 'fs';
import path from 'path';

export type Tool = {
  name: string;
  description: string;
  url: string;
  avatar: string;
};

export function getTools(): Tool[] {
  const filePath = path.join(process.cwd(), 'tools.txt');
  
  if (!fs.existsSync(filePath)) return [];
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const blocks = content.split('::').filter(block => block.trim().length > 0);
  
  return blocks.map(block => {
    const lines = block.trim().split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length >= 3) {
      return {
        name: lines[0],
        description: lines[1],
        url: lines[2],
        avatar: `https://www.google.com/s2/favicons?domain=${lines[2]}&sz=128`
      };
    }
    return null;
  }).filter((item): item is Tool => item !== null);
}
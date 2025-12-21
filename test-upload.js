// Teste da lógica do upload múltiplo
console.log('Testando upload múltiplo...');

const images = ['img1.jpg'];
const files = [{ name: 'file1.jpg' }, { name: 'file2.jpg' }, { name: 'file3.jpg' }];
const maxImages = 5;

let newImages = [...images];
let uploadedCount = 0;

for (let i = 0; i < files.length; i++) {
  if (newImages.length >= maxImages) {
    console.log(`Máximo de ${maxImages} imagens. ${files.length - i} imagem(ns) não foi(foram) adicionada(s).`);
    break;
  }

  // Simular upload bem-sucedido
  const url = `uploaded-${files[i].name}`;
  newImages.push(url);
  uploadedCount++;
}

console.log('Imagens originais:', images);
console.log('Novas imagens:', newImages);
console.log('Upload count:', uploadedCount);
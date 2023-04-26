# Winston-Lu.github.io
[Personal Portfolio](https://winston-lu.github.io)

## 3D Model Workflow
1. Download a 3D model (Preferably STL)
2. [Compress number of verticies here.](https://3dless.com/). Preferably have a total of less than 15k
3. [Convert STL to GLB](https://imagetostl.com/convert/file/stl/to/glb)
4. Clone the [webgl outlines repo](https://github.com/OmarShehata/webgl-outlines)
5. In the `vertex-welder` directory, run `npm run dev` and upload the GLB file to there
6. Set `thresholdAngle` to as high as a value that seems reasonable. Usually just shy of 90 works fine for most models, but models with more curves may benefit from one less than 45
7. Depending on the number of verticies, this step will take a while. Click `weldVerticies` to run. 15k takes around 30 seconds to run. Anything more than 20k will cause the program to hang for quite a long time (at least for my machine). Note that changing the `thresholdAngle` will cause it to re-weld, so changing this value again will take a while to run
8. Download the file
9. Run `npx gltf-pipeline -i welded_model.glb -d --draco.compressionLevel 10 -o compressed.glb` to compress the glb file
import * as THREE from "three";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils";
import chroma from 'chroma-js';
import dayjs from 'dayjs';
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc); // UTCを使うためのおまじない
dayjs.extend(timezone); // タイムゾーンを使うためのおまじない
import { Data } from './Data';

export class Chart {
    private scene: THREE.Scene;
    private data: Data[] = [];
    private startDate: number = 0;
    private endDate: number = 0;
    private offset: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
    private _width: number = 10;
    private _height: number = 60;
    private _depth: number = 10;
    private _radius: number = 0.2;
    private _transp: number = 0.5;
    private colorMode: number = 0;

    private objectList: {
        mesh: THREE.Mesh,
        geometry: any,
        material: any,
    }[] = [];

    private emotionKeyList: string[] = [
        'takaburi', 'odoroki', 'yorokobi',
        'positive', 'suki', 'yasu',
        'aware', 'haji', 'iya',
        'negative', 'kowa', 'ikari',
    ];


    constructor(_scene: THREE.Scene) {
        this.scene = _scene;
    }

    public entryData(_data: Data[]) {
        this.data = _data;
        this.startDate = dayjs(this.data[0].date).startOf('day').valueOf();
        this.endDate = dayjs(this.data[this.data.length - 1].date).endOf('day').valueOf();
    }

    private threeTube(scene: THREE.Scene, head: THREE.Vector3, tail: THREE.Vector3, color: string, transp: number, radius: number): void {

        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: transp
        });

        // 2つの位置データを結ぶ線分
        // Tubeジオメトリで描く
        const path: THREE.LineCurve3 = new THREE.LineCurve3(head, tail);
        const radSeg: number = 10;
        const tubeSeg: number = 1;
        const geometry: THREE.TubeGeometry = new THREE.TubeGeometry(path, tubeSeg, radius, radSeg, false);
        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);


        this.objectList.push({
            geometry: geometry,
            material: material,
            mesh: mesh,
        });

        scene.add(mesh);
    }

    private threeGradTube(scene: THREE.Scene, head: THREE.Vector3, tail: THREE.Vector3, color0: string, color1: string, transp: number, radius: number): void {
        // 2つの位置データを結ぶ線分
        // Tubeジオメトリで描く
        const path: THREE.LineCurve3 = new THREE.LineCurve3(head, tail);
        const radSeg: number = 6;
        const tubeSeg: number = 1;
        const geometry: THREE.TubeGeometry = new THREE.TubeGeometry(path, tubeSeg, radius, radSeg, false);

        // グラデーションのためのvertex shader
        const vertexShader = /* glsl */`
                uniform vec3 pos0;
                uniform vec3 pos1;
                varying float ratio;
                void main() {
                    ratio = distance(position, pos0) / distance(pos1, pos0);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
                }`;

        // グラデーションのためのfragment shader
        const fragmentShader = /* glsl */`
                uniform vec3 color0;
                uniform vec3 color1;
                uniform float transp;
                varying float ratio;
                void main() {
                    float r = color0.x * (1.0 - ratio) + color1.x * ratio;
                    float g = color0.y * (1.0 - ratio) + color1.y * ratio;
                    float b = color0.z * (1.0 - ratio) + color1.z * ratio;
                    gl_FragColor = vec4(r, g, b, transp);
                }`;

        const material = new THREE.ShaderMaterial({
            uniforms: {
                color0: {
                    value: new THREE.Color(color0)
                },
                color1: {
                    value: new THREE.Color(color1)
                },
                pos0: {
                    value: head
                },
                pos1: {
                    value: tail
                },
                transp: {
                    value: transp
                }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            transparent: true,
        });

        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);

        this.objectList.push({
            geometry: geometry,
            material: material,
            mesh: mesh,
        });

        scene.add(mesh);
    }


    // private tubeGeometry(head: THREE.Vector3, tail: THREE.Vector3, radius: number): THREE.TubeGeometry {
    //     const path: THREE.LineCurve3 = new THREE.LineCurve3(head, tail);
    //     const radSeg: number = 8;
    //     const tubeSeg: number = 1;
    //     return new THREE.TubeGeometry(path, tubeSeg, radius, radSeg, false);
    // }

    // private tubeMaterial(posList: THREE.Vector3[], colorList: string[], transp: number): THREE.ShaderMaterial {
    //     const vertexShader = /* glsl */`
    //             uniform vec3[${posList.length}] posList;
    //             varying float ratio;
    //             flat out int index;
    //             void main() {
    //                 index = 0;
    //                 ratio = 0.0;
    //                 for (int i = 0; i < ${posList.length - 1}; i++) {
    //                     vec3 pos0 = posList[i];
    //                     vec3 pos1 = posList[i + 1];
    //                     if (pos1.y > position.y) {
    //                         ratio = distance(position, pos0) / distance(pos1, pos0);
    //                         index = i;
    //                         break;
    //                     }
    //                 }
    //                 gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
    //             }`;

    //     // グラデーション
    //     const fragmentShader = /* glsl */`
    //             uniform vec3[${colorList.length}] colorList;
    //             uniform float transp;
    //             varying float ratio;
    //             flat in int index;
    //             void main() {
    //                 vec3 color0 = colorList[index];
    //                 vec3 color1 = colorList[index + 1];
    //                 float r = color0.x * (1.0 - ratio) + color1.x * ratio;
    //                 float g = color0.y * (1.0 - ratio) + color1.y * ratio;
    //                 float b = color0.z * (1.0 - ratio) + color1.z * ratio;
    //                 // gl_FragColor = vec4(r, g, b, transp);
    //                 gl_FragColor = vec4(ratio, 0, 0, transp);
    //             }`;

    //     return new THREE.ShaderMaterial({
    //         uniforms: {
    //             colorList: {
    //                 value: colorList.map(color => new THREE.Color(color))
    //             },
    //             poslist: {
    //                 value: posList
    //             },
    //             transp: {
    //                 value: transp
    //             }
    //         },
    //         vertexShader: vertexShader,
    //         fragmentShader: fragmentShader,
    //         transparent: true,
    //     });
    // }


    private threeSphere(scene: THREE.Scene, pos: THREE.Vector3, color: string, transp: number, geometry: THREE.SphereGeometry, name: string): void {
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: transp
        });
        
        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(pos.x, pos.y, pos.z);
        mesh.name = name;

        this.objectList.push({
            geometry: geometry,
            material: material,
            mesh: mesh,
        });

        scene.add(mesh);
    }

    private threeCylinder(scene: THREE.Scene, pos: THREE.Vector3, color: string, transp: number, height: number, radius: number) {
        const geometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 32, 1, false);
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: transp,
        });
        const mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(pos.x, pos.y, pos.z);

        this.objectList.push({
            geometry: geometry,
            material: material,
            mesh: mesh,
        });

        scene.add(mesh);
    }

    public translate(x: number, y: number, z: number) {
        this.offset.x = x;
        this.offset.y = y;
        this.offset.z = z;
    }

    public redraw() {
        this.objectList.forEach(obj => {
            obj.geometry.dispose();
            obj.material.dispose();
            this.scene.remove(obj.mesh);
        });
        this.draw();
    }

    public draw() {
        // 上下の円
        const geometry: THREE.CylinderGeometry = new THREE.CylinderGeometry(this._width * 0.9, this._width * 0.9, 1, 32, 1, false)
        const material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color('#808080'),
            transparent: true,
            opacity: 0.1,
        });
        const meshTop: THREE.Mesh = new THREE.Mesh(geometry, material);
        meshTop.position.set(this.offset.x, this._height / 2, this.offset.z);
        this.scene.add(meshTop);
        const meshBtm: THREE.Mesh = new THREE.Mesh(geometry, material);
        meshBtm.position.set(this.offset.x, -this._height / 2, this.offset.z);
        this.scene.add(meshBtm);

        let posList: THREE.Vector3[] = [];
        let colorList: string[] = [];
        const sphereGeometry: THREE.SphereGeometry = new THREE.SphereGeometry(this._radius, 10, 10);
        
        for (let i = 0; i < this.data.length; i++) {
            const posList0 = this.data2pos(this.data[i]);
            const colorList0 = this.data2color(this.data[i]);
            for (let j = 0; j < posList0.length; j++) {
                let head = posList0[j];
                let color0 = colorList0.length === posList0.length ? colorList0[j] : colorList0[0];
                this.threeSphere(this.scene, head, color0, this._transp, sphereGeometry, this.data[i].tweet);

                posList.push(head);
                colorList.push(color0);

                if (j < posList0.length - 1) {
                    const tail = posList0[j + 1];
                    const color1 = colorList0.length === posList0.length ? colorList0[j + 1] : colorList0[0];
                    this.threeGradTube(this.scene, head, tail, color0, color1, this._transp, this._radius * 0.5);
                }
                else if (i < this.data.length - 1 && j === posList0.length - 1) {
                    const colorList1 = this.data2color(this.data[i + 1]);
                    const color1 = colorList1[0];
                    const posList1 = this.data2pos(this.data[i + 1]);
                    const tail = posList1[0];
                    this.threeGradTube(this.scene, head, tail, color0, color1, this._transp, this._radius * 0.5);
                }
            }
            
        }
    }

    public get width(): number {
        return this._width;
    }
    public get depth(): number {
        return this._depth;
    }
    public get height(): number {
        return this._height;
    }

    private data2pos(d: Data): THREE.Vector3[] {
        // // Idea 4.
        // const y: number = (d.date - this.startDate) / (this.endDate - this.startDate) * this._height;
        // let r: number = Math.abs(d.score) * this._width;
        // let posList = d.emotion.map(e => {
        //     const idx: number = this.emotionKeyList.indexOf(e);
        //     let t: number = 2 * Math.PI / 12 * idx;
        //     let x: number = Math.cos(t) * r;
        //     let z: number = Math.sin(t) * r;
        //     return new THREE.Vector3(x, y, z).add(this.offset);
        // });
        // if (posList.length === 1) {
        //     let p = posList[0];
        //     return new THREE.Vector3(p.x, y, p.z);
        // }
        // else if (posList.length <= 3) {
        //     let sx = 0;
        //     let sz = 0;
        //     posList.forEach(p => {
        //         sx += p.x;
        //         sz += p.z;
        //     });
        //     return new THREE.Vector3(sx / posList.length, y, sz / posList.length);
        // }
        // else if (posList.length > 3) {
        //     let p0 = posList[0];
        //     let sumS = 0;
        //     let tmpX = 0;
        //     let tmpZ = 0;
        //     for (let i = 1; i < posList.length - 2; i++) {
        //         let p1 = posList[i];
        //         let p2 = posList[i + 1];

        //         let gx = (p0.x + p1.x + p2.x) / 3;
        //         let gz = (p0.z + p1.z + p2.z) / 3;

        //         let s = Math.abs((p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x)) / 2;

        //         tmpX += gx * s;
        //         tmpZ += gz * s;
        //         sumS += s;
        //     }
        //     return new THREE.Vector3(tmpX / sumS, y, tmpZ / sumS);
        // } else {
        //     return new THREE.Vector3(0, 0, 0);
        // }

        // Idea 3.
        const y: number = (d.date - this.startDate) / (this.endDate - this.startDate) * this._height;
        let r: number = Math.abs(d.score) * this._width;
        let posList = d.emotion.map(e => {
            const idx: number = this.emotionKeyList.indexOf(e);
            let t: number = 2 * Math.PI / this.emotionKeyList.length * idx;
            let x: number = Math.cos(t) * r;
            let z: number = Math.sin(t) * r;
            return new THREE.Vector3(x, y, z).add(this.offset);
        });
        return posList;

        // Idea 2. 
        // const r: number = d.score * this._width / 4;
        // const t1: number = d.positive * 2 * Math.PI;
        // const t2: number = d.negative * -2 * Math.PI;
        // const x: number = r * (Math.cos(t1) + Math.cos(t2));
        // const z: number = r * (Math.sin(t1) + Math.sin(t2));
        // const y: number = (d.date - this.startDate) / (this.endDate - this.startDate) * this._height;

        // Idea 1.
        // const x: number = d.positive * this._width;
        // const z: number = d.negative * this._depth;
        // const y: number = (d.date - this.startDate) / (this.endDate - this.startDate) * this._height;

        // return new THREE.Vector3(x, y, z);
    }

    public changeColorMode(mode: number) {
        this.colorMode = mode;
    }

    private data2color(d: Data): string[] {

        const color0 = (): string[] => {
            const month: number = Number(dayjs(d.date).format('MM'));
            const year: number = Number(dayjs(d.date).format('YYYY'));
            let hue: number = month > 10 ? (22 - month) * 25 + 10 : (10 - month) * 25 + 10;
            let sat: number = (year - 2017) / (2022 - 2017) * 0.8 + 0.1; // sat = [0.1, 0.9]
            let bri: number = (d.score + 1.0) / 2.0;
            return [chroma.hsv(hue, sat, bri).name()];
        }


        const color1 = (): string[] => {
            let hue: number = 0;
            let sat: number = 0;
            let bri: number = (d.score + 1.0) / 2.0;
            return [chroma.hsv(hue, sat, bri).name()];
        }
        const color2 = (): string[] => {
            let hue: number = d.score > 0 ? 10 : 250;
            let sat: number = Math.abs(d.score);
            let bri: number = 1.0;
            return [chroma.hsv(hue, sat, bri).name()];
        }

        const color3 = (): string[] => {
            let sat: number = 0.8;
            let bri: number = 1.0;
            return d.emotion.map(e => {
                let i = this.emotionKeyList.indexOf(e);
                let hue: number = i / this.emotionKeyList.length * 360;
                return chroma.hsv(hue, sat, bri).name();
            });
        }

        const color4 = (): string[] => {
            return ['#FFF'];
        }
        const color5 = (): string[] => {
            return ['#000'];
        }

        let color = [
            color0(), color1(),
            color2(), color3(),
            color4(), color5(),
        ];
        return color[this.colorMode];
    }
}
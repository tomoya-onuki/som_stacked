import dayjs, { Dayjs } from 'dayjs';
import chroma from 'chroma-js';
import $ = require('jquery');
declare var require: any;
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Stats from 'three/examples/jsm/libs/stats.module';
import * as d3 from 'd3';
import { Chart } from './Chart';
import { Data } from './Data';
import { DataSet } from './DataSet';

$(function () {
    new Main().init();
});


class Main {
    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private controls: OrbitControls;

    private chartList: { chart: Chart, date: number }[] = [];
    private startDate: Dayjs = dayjs();
    private endDate: Dayjs = dayjs();
    private stats = Stats();

    constructor() {
        let cvsWidth: number = Number($('#view').width());
        let cvsHeight: number = Number($('#view').height());

        this.renderer = new THREE.WebGLRenderer({ alpha: true });
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, cvsWidth / cvsHeight, 1, 1000);

        // レンダラーを作成
        $("#view").append(this.renderer.domElement)
        this.camera.position.set(60, 0, 60);   // cameraの設定

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(cvsWidth, cvsHeight);
        this.camera.aspect = cvsWidth / cvsHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.debug.checkShaderErrors = true;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        // 動きのなめらかさ
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.2;
        // 垂直方向の回転の制限
        // this.controls.maxPolarAngle = Math.PI / 2;
        // this.controls.minPolarAngle = -Math.PI / 2;
        // ズームの制限
        this.controls.maxDistance = 240;
        this.controls.minDistance = 2;
        // 自動回転
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 4.0;

        // const axes = new THREE.AxesHelper(100);
        // this.scene.add(axes);

        // this.stats.showPanel(0);
        // document.body.appendChild(this.stats.dom);
    }

    public init() {
        this.addEvent();
        this.render();

        fetch('outdata.csv')
            .then(response => response.text())
            .then(csvString => {
                let dataSet: DataSet = new DataSet();
                dataSet.entry(csvString);

                this.startDate = dayjs(dataSet.startDate).startOf('month');
                this.endDate = dayjs(dataSet.endDate).endOf('month');
                // this.startDate = dayjs('2017-1-1').startOf('month');
                // this.endDate = dayjs('2022-12-31').endOf('month');

                let startYear: number = Number(this.startDate.format('YYYY'));
                let endYear: number = Number(this.endDate.format('YYYY'));

                const margin: number = 10;
                let date: Dayjs = this.startDate;
                while (date.valueOf() <= this.endDate.valueOf()) {
                    let date1 = date.add(1, 'M');
                    let chart: Chart = new Chart(this.scene);
                    let data: Data[] = dataSet.slice(date.valueOf(), date1.valueOf());

                    if (data.length > 0) {
                        chart.entryData(data);
                        // console.table(data.map(d => dayjs(d.date).format()));

                        let month = Number(dayjs(date).format('MM'));
                        let year = Number(dayjs(date).format('YYYY'));
                        let x = (month - 1) * (chart.width + margin);
                        let z = (year - startYear) * (chart.depth + margin);
                        let offsetX: number = -(chart.width * 12 + margin * 11) / 2;
                        let offsetY: number = -chart.height / 2;
                        let offsetZ: number = -(chart.depth + margin) * (endYear - startYear) / 2;
                        chart.translate(x + offsetX, 0 + offsetY, z + offsetZ);
                        chart.draw();

                        this.chartList.push({
                            chart: chart,
                            date: date.valueOf()
                        });
                    }
                    date = date1;
                }

                this.dateColorSet();
                this.emotionColorSet();
                $('#load-box').fadeOut();
            })
            .catch(err => console.log(err));
    }

    private addEvent() {
        const me = this;

        $(window).resize(function () {
            me.resize();
        });

        $('#close-ui').on('click', function () {
            $(this).hide();
            $('#ui').hide();
            $('#open-ui').show();
        });
        $('#open-ui').on('click', function () {
            $(this).hide();
            $('#ui').show();
            $('#close-ui').show();
        });
        $('#auto-rotate').on('input', function () {
            me.controls.autoRotate = $(this).prop('checked');
        });
        $('#auto-rotate-speed').on('input', function () {
            me.controls.autoRotateSpeed = Number($(this).val());
        });
        $('#reset').on('click', function () {
            me.controls.reset();
        });
        $('#dark-mode').on('input', function () {
            if ($(this).prop('checked')) {
                $('body').css({
                    'background': '#222',
                    'color': '#FFF'
                });
                $('select').css({
                    'background': 'rgba(34, 34, 34, 0.8)',
                    'color': '#FFF'
                });
                $('button').css({
                    'background': 'rgba(34, 34, 34, 0.8)',
                    'color': '#FFF',
                    'border-color': '#444'
                });
                $('#tweet-modals').css('color', '#EEE');
                $('#cursor').css('background', '#EEE')
                d3.selectAll('text').attr('fill', '#fff');
            } else {
                $('body').css({
                    'background': '#EEE',
                    'color': '#111'
                });
                $('select').css({
                    'background': 'rgba(238, 238, 238, 0.8)',
                    'color': '#111'
                });
                $('button').css({
                    'background': 'rgba(238, 238, 238, 0.8)',
                    'color': '#111',
                    'border-color': '#ccc'
                });
                $('#tweet-modals').css('color', '#111');
                $('#cursor').css('background', '#111')
                d3.selectAll('text').attr('fill', '#111');
            }
        });
        $('#color-mode').on('input', function () {
            async function redraw(mode: number) {
                return new Promise((resolve, reject) => {
                    me.chartList.forEach(obj => {
                        obj.chart.changeColorMode(mode);
                        obj.chart.redraw();
                    });
                    resolve(true);
                });
            }

            let mode: number = Number($(this).find('option:selected').val());
            if (mode === 0) {
                $('#date-color-scheme').show();
            } else {
                $('#date-color-scheme').hide();
            }
            if (mode === 3) {
                $('#emotion-color-scheme').show();
            } else {
                $('#emotion-color-scheme').hide();
            }
            if (mode < 3) {
                $('#score-gradient > div').hide();
                $('#score-gradient > div').eq(mode).show();
            } else {
                $('#score-gradient').hide();
                $('#score-label').hide();
            }

            $('#load-box').fadeIn(500, function () {
                redraw(mode)
                    .then(() => {
                        $('#load-box').fadeOut();
                    });
            });
        });


        $('#ui').on('mousemove', function () {
            $('#cursor').hide();
        });

        let visTweetObjID: string[] = [];
        $('#view')
            .on('mousemove', function (e) {
                let x = e.clientX;
                let y = e.clientY;
                $('#cursor')
                    .show()
                    .offset({
                        "top": y,
                        "left": x
                    })
                    .fadeOut(2000);
            })
            .on('mousedown', function (event) {
                const x: number = event.clientX;
                const y: number = event.clientY;
                let mouse: THREE.Vector2 = new THREE.Vector2();
                mouse.x = (x / window.innerWidth) * 2 - 1;
                mouse.y = -(y / window.innerHeight) * 2 + 1;

                let raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, me.camera);
                let intersects = raycaster.intersectObjects(me.scene.children);
                // console.log(`${intersects[0].point.x}, ${intersects[0].point.y}, ${intersects[0].point.z}`);

                //光線と交差したオブジェクトがある場合
                if (intersects.length > 0) {
                    const obj = intersects[0].object;
                    if (!visTweetObjID.includes(obj.uuid)) {
                        visTweetObjID.push(obj.uuid);

                        let elem = $('<div></dvi>')
                            .addClass('tweet')
                            .offset({ top: y, left: x })
                            .html(obj.name)
                            .fadeOut(10000, () => {
                                elem.remove();
                                visTweetObjID = visTweetObjID.filter(id => id !== obj.uuid);
                            });
                        $('#tweet-modals').append(elem);
                    }
                }
            });
    }

    private render() {
        const me = this;
        let frame: number = 0;
        const tick = () => {
            requestAnimationFrame(tick);

            me.stats.begin();
            me.stats.end();
            me.controls.update();
            me.renderer.render(me.scene, me.camera);
            // frame++;
            // if (frame % 2 != 0) {
            // }
        };
        tick(); // 初回の実行

        // setInterval(() => {
        //     me.stats.begin();
        //     me.controls.update();
        //     me.renderer.render(me.scene, me.camera);
        //     me.stats.end();
        // }, 1000 / 24);
    }

    private resize() {
        let cvsWidth: number = Number($('#view').width());
        let cvsHeight: number = Number($('#view').height());

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(cvsWidth, cvsHeight);

        this.camera.aspect = cvsWidth / cvsHeight;
        this.camera.updateProjectionMatrix();
    }

    private dateColorSet() {

        const cw: number = Number($("#date-color-scheme").width()) + 60;
        const ch: number = Number($("#date-color-scheme").height()) + 20;
        const svg = d3.select("#date-color-scheme")
            .append("svg")
            .attr("width", cw)
            .attr("height", ch);

        let yearList: string[] = [];
        let monthList: number[] = [];

        let startYear: number = Number(this.startDate.format('YYYY'));
        let endYear: number = Number(this.endDate.format('YYYY'));

        this.chartList.forEach(obj => {

            let month = Number(dayjs(obj.date).format('MM'));
            let year = Number(dayjs(obj.date).format('YYYY'));
            let s = (year - startYear) / (endYear - startYear) * 0.8 + 0.1;
            let h = month > 10 ? (22 - month) * 25 + 10 : (10 - month) * 25 + 10;
            let b = 1.0;

            svg.append('rect')
                .attr('x', (month - 1) * 12)
                .attr('y', (year - startYear) * 12)
                .attr('transform', 'translate(25, 10)')
                .attr('width', 10)
                .attr('height', 10)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr('fill', chroma.hsv(h, s, b).name())

            yearList.push(String(year));
            monthList.push(month);

        });


        svg.selectAll()
            .data(Array.from(new Set(yearList)))
            .enter()
            .append('text')
            .attr('transform', 'translate(0, 12)')
            .attr('x', 0)
            .attr('y', (d, i) => i * 12)
            .attr('fill', '#FFF')
            .attr('dominant-baseline', 'text-before-edge')
            .text((d) => d);

        svg.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('transform', 'translate(25, 0)')
            .attr('fill', '#FFF')
            .attr('dominant-baseline', 'text-before-edge')
            .text('Jan');
        svg.append('text')
            .attr('x', 12 * 11)
            .attr('y', 0)
            .attr('transform', 'translate(25, 0)')
            .attr('fill', '#FFF')
            .attr('dominant-baseline', 'text-before-edge')
            .text('Dec');
    }

    private emotionColorSet() {
        const emotionKeyList: string[] = [
            'takaburi', 'odoroki', 'yorokobi',
            'positive', 'suki', 'yasu',
            'aware', 'haji', 'iya',
            'negative', 'kowa', 'ikari',
        ];
        const emotionWordEn: string[] = [
            'excitement', 'surprise', 'joy',
            'positive', 'like', 'serenity',
            'sadness', 'shame', 'disgust',
            'negative', 'fear', 'anger',
        ];
        const cw: number = Number($("#emotion-color-scheme").width());
        const ch: number = Number($("#emotion-color-scheme").height());
        const svg = d3.select("#emotion-color-scheme")
            .append("svg")
            .attr("width", cw)
            .attr("height", ch);

        emotionKeyList.forEach((e, i) => {
            let hue: number = i / emotionKeyList.length * 360;

            svg.append('rect')
                .attr('x', i * 14)
                .attr('y', 0)
                // .attr('transform', 'translate(25, 10)')
                .attr('width', 12)
                .attr('height', 12)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr('fill', chroma.hsv(hue, 1.0, 1.0).name());
            svg.append('text')
                .attr('x', 0)
                .attr('y', 0)
                .attr('transform', `translate(${i * 14 + 3}, 15) rotate(90)`)
                .attr('fill', '#FFF')
                .text(emotionWordEn[i]);
        });
    }
}
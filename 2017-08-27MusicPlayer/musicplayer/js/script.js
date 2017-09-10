// var MPlayer = (function (){
function MPlayer(configs, cb) {

    var $this = this;
    this.init(cb);
}
MPlayer.prototype = {
    constructor: MPlayer,
    init: function (cb) {

        this.audio = $('<audio controls></audio>').appendTo($('body'));
        this.audioDom = this.audio[0];
        if (typeof cb === 'function') {

            cb.call(this);
        }
        this.ceshi();
    },
    _easeOut: function (t, b, c, d) {
        return c * t / d + b;
    },
    getInfor: function () {
        this.infor = configs.inforList;
    },
    next: function () {

    },
    play: function () {
        if (this.audio.prop('paused')) {

            this.audio.play();
        } else {

            this.audio.pause();
        }
    },
    playMusic: function (src) {
        console.log(src);
        this.audio.attr({
            'src': src
        });
        this.audioDom.play();
    },
    tabMusic: function (src) {
        if (this.audio.prop('paused')) {

            this.audio.attr({
                'src': src
            });
            this.audioDom.play();
        } else {
            console.log(10);
            var $this = this,
                initVol = this.audioDom.volume,
                vol = initVol - 0.1,
                timer,
                dir = - 0.2;
            timer = setInterval(function () {
                console.log('v'+vol, initVol)
                if (vol >= initVol) {
                    console.log('end'+initVol)
                    $this.audioDom.volume = initVol - 0.1;
                    console.log('end'+$this.audioDom.volume)
                    clearInterval(timer);
                } else if(vol <= 0) {
                    dir = -dir;
                    // // $this.audioDom.volume = vol;
                    // // vol = Math.max(0, vol-0.1);
                    // console.log($this.audioDom.volume);
                    $this.audio.attr({
                        'src': src
                    });
                    $this.audioDom.play();

                    // vol = Math.min(1, vol+0.1);
                    // $this.audioDom.volume = vol;
                    console.log(initVol);
                }
                vol += dir;
                $this.audioDom.volume = vol;
            }, 50);
        }
    },
    ceshi: function () {
        var audio = this.audioDom;
        audio.oncanplay = function () {
            console.log('已经可以播放') // (7)
        }
        audio.oncanplaythrough = function () {
            console.log('当浏览器可在不因缓冲而停顿的情况下进行播放时触发。') // (10)
        }
        audio.ondurationchange = function () {
            console.log('当音频/视频的时长已更改时触发。') // (4)
        }
        audio.onemptied = function () {
            console.log('当目前的播放列表为空时触发。')
        }
        audio.onended = function () {
            console.log('视频播放结束')
        }
        audio.onloadeddata = function () {
            console.log('已加载当前帧') // (6)
        }
        audio.onloadedmetadata = function () {
            console.log('音频/视频的元数据(时长、尺寸（仅视频）以及文本轨道。)加载完成') // (5)
        }
        audio.onloadstart = function () {
            console.log('浏览器开始加载数据') // (1)
        }
        audio.onpause = function () {
            console.log('以暂停')
        }
        audio.onplay = function () {
            console.log('已播放') // (8)
        }
        audio.onplaying = function () {
            console.log('已播放，但是目前等待缓冲中') // (9)
        }
        audio.onprogress = function () {
            console.log('下载中') // (2)
        }
        audio.onratechange = function () {
            console.log('播放速率已经发生改变')
        }
        audio.onstalled = function () {
            console.log('数据不可用')
        }
        audio.onseeked = function () {
            console.log('调到新的播放位置后')
        }
        audio.onstalled = function () {
            console.log('调到新的播放位置前')
        }
        audio.ontimeupdate = function () {
            console.log('当前的播放位置发生变化') // 持续触发 (11)
        }
        audio.onvolumechange = function () {
            console.log('当前的音量发生变化')
        }
        audio.onsuspend = function () {
            console.log('浏览器不获取媒体数据') // (3)
        }
    }
};

// return MPlayer;
// })
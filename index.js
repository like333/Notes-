/**
 * @like 2017/8/28 22:32
 */
'use strict'
//名字模块

var app = {
    util: {},
    store: {}
}
//方法模块
app.util = {
    $: function (selector, node) {
        return (node || document).querySelector(selector)
    },
    formatTime: function (ms) {
        ms = new Date(ms)
        var pad = function (t) {
            if (t < 10) {
                return '0' + t
            }
            return t
        },
            year = ms.getFullYear(),
            month = ms.getMonth() + 1,
            date = ms.getDate(),
            hour = ms.getHours(),
            min = ms.getMinutes(),
            sec = ms.getSeconds()
        return year + '-' + pad(month) + '-' + pad(date) + ' ' + pad(hour) + ':' + pad(min) + ':' + pad(sec)
    }
}
//存储模块

app.store = {
    "__store_key": '__stick_note__',
    get: function (id) {
        var notes = this.getNotes()
        return notes[id] || {}
    },
    set: function (id, content) {
        var notes = this.getNotes()
        if (notes[id]) {
            Object.assign(notes[id], content)
        }
        else {
            // console.log(content)
            notes[id] = content
        }
        localStorage[this.__store_key] = JSON.stringify(notes)
        // console.log('note-id:' + id + 'content：' + JSON.stringify(content))
    },

    remove: function (id) {
        var notes = this.getNotes()
        delete notes[id]
        localStorage[this.__store_key] = JSON.stringify(notes)
    },
    getNotes: function () {
        return JSON.parse(localStorage[this.__store_key] || '{}')
    }
}
!function (util, store) {
    var $ = util.$
    var moveNote = null, startX, startY,
        maxZIndex = 0
    var noteTpl = `
        <i class="u-close"></i>
        <div class="u-editor" contenteditable></div>
        <div class="u-timestamp">
            <span>更新：</span>
            <span class="time"></span>
        </div>
    `
    function Note(options) {
        var note = document.createElement('div')
        note.className = 'm-note'
        note.id = options.id || 'm-note-' + Date.now()
        note.innerHTML = noteTpl
        note.style.left = options.left + 'px'
        note.style.top = options.top + 'px'
        note.style.zIndex = options.zIndex
        $('.u-editor', note).innerHTML = options.content || ''
        document.body.appendChild(note)
        this.bgColor = ['#ADF194', '#5ABDD9', '#F7EC1F', '#F98E90']
        this.note = note
        this.createTime(options.updateTime)
        this.setBgColor(options.bgColor)
        this.addEvent()
    }
    Note.prototype.setBgColor = function (options) {

        var len = this.bgColor.length;
        var randomIndex = Math.round(Math.random() * len)
        this.note.style.backgroundColor = options ? options : this.bgColor[randomIndex]
        store.set(this.note.id, {
            bgColor: this.note.style.backgroundColor
        })
    }
    Note.prototype.saveStore = function () {
        store.set(this.note.id, {
            left: this.note.offsetLeft,
            top: this.note.offsetTop,
            zIndex: this.note.style.zIndex,
            content: $('.u-editor', this.note).innerHTML,
            updateTime: this.updateTime
        })
    }
    Note.prototype.createTime = function (ms) {
        var ts = ms || Date.now()
        $('.time', this.note).innerHTML = util.formatTime(ts)
        this.updateTime = ts
    }
    Note.prototype.close = function () {
        document.body.removeChild(this.note)
    }
    Note.prototype.addEvent = function () {
        //editor input事件
        var editor = $('.u-editor', this.note)
        var inputTimer
        var inputHandler = function () {

            clearTimeout(inputTimer)
            var content = editor.innerHTML
            inputTimer = setTimeout(function () {
                var time = Date.now()
                store.set(this.note.id, {
                    'content': content,
                    'updateTime': time
                })
                this.createTime(time)
            }.bind(this), 300)
        }.bind(this)
        editor.addEventListener('input', inputHandler)
        //mousedown on note事件
        var mousedownHandler = function (e) {
            moveNote = this.note
            startX = e.clientX - moveNote.offsetLeft
            startY = e.clientY - moveNote.offsetTop
            //置顶设置
            if (parseInt(this.note.style.zIndex) !== maxZIndex - 1) {
                this.note.style.zIndex = maxZIndex++
            }
            store.set(this.note.id, {
                'zIndex': maxZIndex - 1
            })
        }.bind(this)
        this.note.addEventListener('mousedown', mousedownHandler)
        //关闭节点同时关闭节点上的对应事件
        var closeBtn = $('.u-close', this.note)
        var closeHandler = function () {
            store.remove(this.note.id)
            this.note.removeEventListener('mousedown', mousedownHandler)
            closeBtn.removeEventListener('click', closeHandler)
            this.close()
        }.bind(this)
        closeBtn.addEventListener('click', closeHandler)
    }

    document.addEventListener('DOMContentLoaded', function (e) {
        //创建note
        $('#create').addEventListener('click', function () {
            var note = new Note({
                left: Math.round(Math.random() * (window.innerWidth - 220)),
                top: Math.round(Math.random() * (window.innerHeight - 280)),
                zIndex: maxZIndex++
            })
            note.saveStore()
        })
        //清除事件
        $('#clear').addEventListener('click', function () {
            var notes = store.getNotes()
            for (var id in notes) {
                store.remove(id)
            }
            var notes = document.querySelectorAll('.m-note')
            notes.forEach(function (elem) {
                document.body.removeChild(elem)
            })

        })
        //移动监听
        function mousemoveHandler(e) {
            if (!moveNote) return
            var disX = e.clientX - startX
            var disY = e.clientY - startY
            if (disX < 0) {
                disX = 0
            } else if (disX > document.documentElement.clientWidth - moveNote.offsetWidth) {
                disX = document.documentElement.clientWidth - moveNote.offsetWidth
            }
            if (disY < 0) {
                disY = 0
            } else if (disY > document.documentElement.clientHeight - moveNote.offsetHeight) {
                disY = document.documentElement.clientHeight - moveNote.offsetHeight
            }
            // console.log(disY)
            console.log(window.innerHeight)
            moveNote.style.left = disX + 'px'
            moveNote.style.top = disY + 'px'

        }
        function mouseupHandler() {
            if (!moveNote) return
            store.set(moveNote.id, {
                'left': moveNote.offsetLeft,
                'top': moveNote.offsetTop
            })
            moveNote = null
        }
        document.addEventListener('mousemove', mousemoveHandler)
        document.addEventListener('mouseup', mouseupHandler)

        // 初始化note
        var notes = store.getNotes()
        for (var id in notes) {
            var options = notes[id]
            //之所以要设置maxZIndex是要记录上一次的maxZIndex,因为页面刷新之后，maxZIndex
            //重新变成了0，所以要设置为当前已经记录的最大值
            if (maxZIndex < options.zIndex) {
                maxZIndex = options.zIndex
            }
            new Note(Object.assign(options, { id: id }))
        }

        //这里加1是因为点击的时候，maxZIndex++,两个元素zIndex相同，不能压置为最顶层
        maxZIndex += 1
    })

}(app.util, app.store)
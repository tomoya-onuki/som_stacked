$(function () {
    $('.toggle-switch').each(function () {
        let toggleBox = $('<div></div>').addClass('toggle-box')
        // let toggleBox = $('<span></span>').addClass('toggle-box')
        $(this).after(toggleBox)

        let tmp = $(this)
        let id = $(this).attr('id')
        $(this).remove()

        let label = $('<label></label>').addClass('check').attr('for', id)
        let thumb = $('<div></div>').addClass('thumb')
        label.append(thumb)

        toggleBox.append(tmp, label)
    })
});
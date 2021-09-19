export default function ({ log }) {
    removeThankButton(document)
    new MutationObserver((mutations, observer) => {
        // log(mutations)
        for (let m of mutations) {
            for (let node of m.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    removeThankButton(node)
                }
            }
        }
    }).observe(document.body, {
        childList: true,
        subtree: true
    })
    function removeThankButton(node) {
        let count = 0
        node.querySelectorAll('button.ContentItem-action')
            .forEach(btn => {
                let $text = btn.childNodes[1]
                let group
                if ($text && $text.nodeType === Node.TEXT_NODE) {
                    let text = $text.textContent
                    count++
                    if (text === '感谢' || text === '取消感谢') {
                        btn.style.display = 'none'
                    } else if (text === '举报' || text === '收藏') {
                        $text.textContent = ''
                    } else if ((group = text.match(/(\d+) 条评论/))) {
                        $text.textContent = `${group[1]}`
                    } else {
                        count--
                    }
                }
            })
        if (count > 0) {
            log(`modify: ${count}`)
        }
    }
}

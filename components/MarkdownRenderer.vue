<template>
    <div v-html="renderedHtml" class="markdown-content"></div>
</template>

<script lang="ts" setup>
const props = defineProps<{
    content: string;
}>();

// sanitized, safe for `v-html`
const renderedHtml = computed(() => renderMarkdown(props.content));
</script>

<style lang="scss">
@import '~/assets/theme/_eg-colors.scss';

.markdown-content {
    line-height: 2;
    a {
        color: $eg-c-secondary;
        text-decoration: underline;
    }
    a:hover {
        color: $eg-c-secondary-dark;
    }
    h1,
    h2,
    h3,
    h4 {
        margin-top: 1rem;
        &:first-child {
            margin-top: 0;
        }
    }
    hr {
        margin: 2.5rem 0;
        border-style: solid;
        border-color: $eg-c-gray-400;
    }
}
</style>

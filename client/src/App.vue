<template>
  <img alt="Vue logo" src="./assets/logo.png">
</template>

<script setup>
import axios from 'axios'

axios.post('/api/list').then(res => {
  console.log(res)
})

</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

package main

import (
	"context"
	"crypto/rand"
	"fmt"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"os"
	"path"
	"strconv"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

// 打开选择目录对话框
func (a *App) OpenDir() string {
	res, _ := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{})
	return res
}

type ProgressEvent struct {
	Loaded float64 `json:"loaded"` // 当前进度
	Total  float64 `json:"total"`  // 总进度
}

type GenFilesOptions struct {
	Target string `json:"target"` // 生成文件存放目录
	Name   string `json:"name"`   // 文件名称
	Start  uint   `json:"start"`  // 起始文件序号
	Total  uint   `json:"total"`  // 生成文件数量
	Size   uint   `json:"size"`   // 每个文件的尺寸
}

func (a *App) GenFiles(opt GenFilesOptions) {
	if _, err := os.Stat(opt.Target); os.IsNotExist(err) {
		if err := os.MkdirAll(opt.Target, 0755); err != nil {
			fmt.Println("文件夹创建失败", err)
			return
		}
	}

	loaded := opt.Total

	for i := uint(0); i < opt.Total; i++ {
		fname := opt.Name + "_" + strconv.FormatUint(uint64(i+opt.Start), 10)
		filePath := path.Join(opt.Target, fname)

		err := gFile(filePath, opt.Size, func(loaded, total float64) {
			progress := loaded / total * 100
			msg := fmt.Sprintf(fname+"进度: %.0f", progress)
			runtime.EventsEmit(a.ctx, "message", msg+"%")
		})
		if err != nil {
			panic(err)
		}
		loaded--
		runtime.EventsEmit(a.ctx, "progress", ProgressEvent{
			Loaded: float64(opt.Total - loaded),
			Total:  float64(opt.Total),
		})
	}
}

func gFile(filePath string, size uint, onProgress func(loaded, total float64)) error {
	file, err := os.OpenFile(filePath, os.O_WRONLY|os.O_APPEND|os.O_CREATE, 0666)
	if err != nil {
		return err
	}
	defer file.Close()

	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return err
	}

	// 计算需要填充的字节数
	totalSize := int64(size) - fileInfo.Size()

	// 分段写入避免大文件内存溢出
	fileSize := totalSize
	var rangeSize int64 = 1024 * 1024 * 100
	for fileSize > 0 {
		s := rangeSize
		if fileSize < rangeSize {
			s = fileSize
		}

		// 生成随机数据
		data := make([]byte, s)
		if _, err = rand.Read(data); err != nil {
			fileSize = 0
			return err
		}
		// 写入文件
		if _, err = file.Write(data); err != nil {
			fileSize = 0
			return err
		}
		fileSize -= s

		// 进度
		onProgress(float64(totalSize-fileSize), float64(totalSize))
	}

	return nil
}

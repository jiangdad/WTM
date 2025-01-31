/**
 * @author 冷 (https://github.com/LengYXin)
 * @email lengyingxin8966@gmail.com
 * @create date 2019-06-26 16:55:28
 * @modify date 2019-06-26 16:55:28
 * @desc [description]
 */
// import { IActionProps, Action } from '../action';
import { GridApi, GridReadyEvent, SelectionChangedEvent } from 'ag-grid-community';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import { LicenseManager } from 'ag-grid-enterprise';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import { Icon, Pagination, Switch } from 'antd';
import { PaginationProps } from 'antd/lib/pagination';
import globalConfig from 'global.config';
import lodash from 'lodash';
import { BindAll, Debounce } from 'lodash-decorators';
import { toJS } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { fromEvent, Subscription } from 'rxjs';
import Store from 'store/dataSource';
import "./style.less";
import { columnsRenderImg } from './table';
LicenseManager.setLicenseKey('SHI_UK_on_behalf_of_Lenovo_Sweden_MultiApp_1Devs6_November_2019__MTU3Mjk5ODQwMDAwMA==e27a8fba6b8b1b40e95ee08e9e0db2cb');
interface ITableProps extends AgGridReactProps {
    /** 状态 */
    Store: Store,
    /**
     * 容器样式
     */
    style?: React.CSSProperties;
    /**
     * 主题
     */
    theme?: string;
    /**
     * 样式
     */
    className?: string;
    /**
     * 分页
     */
    paginationProps?: PaginationProps | boolean;
    /**
     * 加载中
     */
    loading?: boolean;
    /**
     * 选择
     */
    checkboxSelection?: boolean;
}
const frameworkRender = {
    columnsRenderImg: (props) => {
        return columnsRenderImg(props.value, props.data)
    },
    columnsRenderBoolean: (props) => {
        return props.value ? <Switch checkedChildren={<Icon type="check" />} unCheckedChildren={<Icon type="close" />} disabled defaultChecked /> : <Switch checkedChildren={<Icon type="check" />} unCheckedChildren={<Icon type="close" />} disabled />
    }
}
export class AgGrid extends React.Component<ITableProps, any> {
    /**
     * 全屏 容器
     */
    refFullscreen = React.createRef<HTMLDivElement>();
    render() {
        let {
            ...props
        } = this.props;
        return (
            <Table {...props} />
        );
    }
}
@observer
@BindAll()
class Table extends React.Component<ITableProps, any> {
    gridApi: GridApi;
    // 表格容器
    refTableBody = React.createRef<HTMLDivElement>();
    // 事件对象
    resizeEvent: Subscription;
    minHeight = 400;
    state = {
        height: this.minHeight
    }
    /**
     * 修改 高度 
     * @param refFullscreen 
     */
    @Debounce(200)
    onUpdateHeight(refFullscreen = false) {
        try {
            // props 中传递了 height
            if (this.props.style && this.props.style.height) {
                return
            }
            const refTable = this.refTableBody.current;//ReactDOM.findDOMNode(this.ref.current) as HTMLDivElement;
            // 60 是头部 标题栏 高度
            let height = window.innerHeight - refTable.offsetTop - 60 - 100;
            // // 全屏 加回 60 高度
            // if (refFullscreen) {
            //     height += 60;
            // }
            height = height < this.minHeight ? this.minHeight : height;
            if (this.state.height !== height) {
                this.gridApi.sizeColumnsToFit();
                this.setState({ height });
            }
        } catch (error) {
            console.log(error)
        }
    }
    // onGetColumnDefs() {
    //     let columnDefs = [...this.props.columnDefs];
    //     console.log(columnDefs.reduce((accumulator, currentValue) => {
    //         return accumulator.width + currentValue.w
    //     }), 0)
    //     return columnDefs;
    // }
    /**
     * 分页 参数 改变回调
     * @param current 
     * @param pageSize 
     */
    onChangePagination(current: number, pageSize: number) {
        console.log("TCL: App -> onChangePagination -> ", current, pageSize)
        this.props.Store.onSearch({
            Page: current,
            Limit: pageSize
        });
    }
    /**
     * 选择的 行 数据 回调
     * @param event 
     */
    onSelectionChanged(event: SelectionChangedEvent) {
        console.log("TCL: App -> onSelectionChanged -> event", event.api.getSelectedRows())
        this.props.Store.DataSource.selectedRowKeys = lodash.map(event.api.getSelectedRows(), 'key');
    }

    componentDidMount() {
        this.props.Store.onSearch();
        this.onUpdateHeight();
        this.resizeEvent = fromEvent(window, "resize").subscribe(e => {
            this.onUpdateHeight(lodash.get(e, 'detail') === 'refFullscreen');
            this.gridApi.sizeColumnsToFit();
        });
    }
    componentWillUnmount() {
        this.resizeEvent && this.resizeEvent.unsubscribe()
    }
    onGridReady(event: GridReadyEvent) {
        this.gridApi = event.api;
        // 更新 列 大小
        event.api.sizeColumnsToFit();
    }
    public render() {
        let {
            Store,
            paginationProps,
            style,
            theme = 'ag-theme-balham',
            className = '',
            children,
            onGridReady,
            loading,
            defaultColDef,
            columnDefs,
            checkboxSelection = true,
            frameworkComponents,
            // rowData,
            ...props
        } = this.props;
        const { DataSource } = Store;
        const dataSource = DataSource.tableList;
        if (loading) {
            props.rowData = undefined
        } else {
            props.rowData = toJS(dataSource.Data);
        }
        return (
            <>
                <div ref={this.refTableBody} style={{ height: this.state.height, ...style }} className={`lenovo-ag-grid ${className} ${theme}`}>
                    {/* <Spin spinning={loading} > */}
                    <AgGridReact
                        suppressNoRowsOverlay
                        suppressLoadingOverlay
                        rowSelection="multiple"
                        {...props}
                        frameworkComponents={
                            { ...frameworkRender, ...frameworkComponents }
                        }
                        defaultColDef={{
                            // editable: true,
                            resizable: true,
                            sortable: true,
                            ...defaultColDef
                        }}
                        columnDefs={[
                            checkboxSelection && {
                                editable: false,
                                filter: false,
                                resizable: false,
                                checkboxSelection: true,
                                headerCheckboxSelection: true,
                                width: 45,
                                maxWidth: 45,
                                minWidth: 45,
                                pinned: 'left',
                            },
                            ...columnDefs
                        ].filter(Boolean)}
                        onSelectionChanged={this.onSelectionChanged}
                        onGridReady={event => {
                            onGridReady && onGridReady(event);
                            this.onGridReady(event);
                        }}
                    />
                    {/* </Spin> */}
                </div>
                <Pagination
                    className='ant-table-pagination'
                    {...{
                        position: "bottom",
                        showSizeChanger: true,//是否可以改变 pageSize
                        showQuickJumper: true,
                        pageSize: dataSource.Limit,
                        pageSizeOptions: lodash.get(globalConfig, 'pageSizeOptions', ['10', '20', '30', '40', '50', '100', '200']),
                        size: "small",
                        current: dataSource.Page,
                        // defaultPageSize: dataSource.Limit,
                        // defaultCurrent: dataSource.Page,
                        total: dataSource.Count,
                        onChange: this.onChangePagination,
                        onShowSizeChange: this.onChangePagination
                    }}
                />
            </>
        );
    }
}

export default AgGrid
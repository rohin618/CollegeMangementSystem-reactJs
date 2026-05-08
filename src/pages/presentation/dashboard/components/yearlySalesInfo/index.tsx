import React, { useState, useMemo } from 'react';
import moment, { Moment } from 'moment';
import { ApexOptions, ApexAxisChartSeries } from 'apexcharts';
import {
    CardActions,
    Card,
    CardBody,
    CardHeader,
    CardLabel,
    CardSubTitle,
    CardTitle,
} from '../../../../../components/bootstrap';
import Button, { ButtonGroup } from '../../../../../components/bootstrap/Button';
import Chart from '../../../../../components/extras/Chart';
import useDarkMode from '../../../../../hooks/useDarkMode';
import { INVOICE_TO_TYPE_LIST } from '../../../../../common/data/option';
import { useQuery } from '@tanstack/react-query';
import { getAllInvoicesList } from '../../../../../common/api/invoice';
import { getInvoiceMonthlySummary, priceFormat } from '../../../../../helpers/helpers';

interface Invoice {
    id: string | number;
    totalInvoicePrice: number;
    payedAmount: number;
}

interface OverAllRevenuItem {
    month: string;
    invoiceTo: number;
    invoices: Invoice[];
}

export const YearlySalesInfo: React.FC = () => {
    const { themeStatus } = useDarkMode();
    const [selectedYear, setSelectedYear] = useState<Moment>(
        moment().startOf('year')
    );

    /* ---------------- QUERY OBJECT ---------------- */

    const invoiceQuery = useMemo(() => ({
        sDate: selectedYear.clone().startOf('year').format('YYYY-MM-DD'),
        eDate: selectedYear.clone().endOf('year').format('YYYY-MM-DD'),
    }), [selectedYear]);

    const {
        data: invoiceListByCompany = [],
        isLoading,
        isError,
    } = useQuery({
        queryKey: ['invoiceListByCompany', invoiceQuery],
        queryFn: () => getAllInvoicesList(invoiceQuery),
        keepPreviousData: true,
    });

    /* ---------------- MONTHLY SUMMARY ---------------- */

    const overAllRevenu = useMemo(() => {
        if (!invoiceListByCompany.length) return [];
        return getInvoiceMonthlySummary(
            invoiceListByCompany,
            selectedYear.year()
        );
    }, [invoiceListByCompany, selectedYear.year()]);

    /* ---------------- PRECOMPUTE INDEX MAP ---------------- */

    const invoiceTypeIndexMap = useMemo(() => {
        const map: Record<number, number> = {};
        INVOICE_TO_TYPE_LIST.forEach((item, index) => {
            map[item.value] = index;
        });
        return map;
    }, []);

    /* ---------------- SERIES ---------------- */

    const salesByStoreSeries: ApexAxisChartSeries = useMemo(() => {
        const length = INVOICE_TO_TYPE_LIST.length;
        const invoiceRaised = Array(length).fill(0);
        const invoiceCollected = Array(length).fill(0);

        overAllRevenu.forEach(({ invoices = [], invoiceTo }) => {
            const index = invoiceTypeIndexMap[invoiceTo];
            if (index === undefined) return;

            invoices.forEach(({ totalInvoicePrice = 0, payedAmount = 0 }) => {
                invoiceRaised[index] += totalInvoicePrice;
                invoiceCollected[index] += payedAmount;
            });
        });

        const totalRaised = invoiceRaised.reduce((a, b) => a + b, 0);
        const totalCollected = invoiceCollected.reduce((a, b) => a + b, 0);

        return [
            {
                name: `Invoice Raised (${priceFormat(totalRaised)})`,
                type: 'column',
                data: invoiceRaised,
            },
            {
                name: `Invoice Collected (${priceFormat(totalCollected)})`,
                type: 'column',
                data: invoiceCollected,
            },
        ];
    }, [overAllRevenu, invoiceTypeIndexMap]);

    /* ---------------- OPTIONS ---------------- */

    const salesByStoreOptions: ApexOptions = {
        chart: {
            height: 370,
            type: 'line',
            stacked: false,
            toolbar: { show: false },
        },
        colors: [
            import.meta.env.VITE_SUCCESS_COLOR,
            import.meta.env.VITE_WARNING_COLOR,
        ],
        dataLabels: { enabled: false },
        stroke: { width: [1, 1], curve: 'smooth' },
        plotOptions: {
            bar: {
                borderRadius: 5,
                columnWidth: '25%',
            },
        },
        xaxis: {
            categories: INVOICE_TO_TYPE_LIST.map(({ label }) => label),
        },
        yaxis: [
            {
                labels: {
                    formatter: (val: number) => priceFormat(val),
                },
                title: { text: 'Invoice Raised' },
            },
            {
                opposite: true,
                labels: {
                    formatter: (val: number) => priceFormat(val),
                },
                title: { text: 'Invoice Collected' },
            },
        ],
        tooltip: {
            theme: themeStatus,
            y: {
                formatter: (val: number) => priceFormat(val),
            },
        },
        legend: { horizontalAlign: 'left' },
    };

    /* ---------------- YEAR CHANGE ---------------- */

    const handleDateChange = (type: 'prev' | 'next') => {
        setSelectedYear(prev =>
            type === 'prev'
                ? prev.clone().subtract(1, 'year')
                : prev.clone().add(1, 'year')
        );
    };

    /* ---------------- UI ---------------- */

    return (
        <Card stretch>
            <CardHeader>
                <CardLabel icon="ReceiptLong">
                    <CardTitle tag="div" className="h5">
                        Sales by Stores
                    </CardTitle>
                    <CardSubTitle tag="div" className="h6">
                        Reports
                    </CardSubTitle>
                </CardLabel>

                <CardActions>
                    <ButtonGroup>
                        <Button
                            color="primary"
                            isLight
                            icon="ChevronLeft"
                            onClick={() => handleDateChange('prev')}
                        />
                        <Button color="primary" isLight isDisable>
                            {selectedYear.format('YYYY')}
                        </Button>
                        <Button
                            color="primary"
                            isLight
                            icon="ChevronRight"
                            onClick={() => handleDateChange('next')}
                        />
                    </ButtonGroup>
                </CardActions>
            </CardHeader>

            <CardBody>
                <Chart
                    series={salesByStoreSeries}
                    options={salesByStoreOptions}
                    type="line"
                    height={370}
                />
            </CardBody>
        </Card>
    );
};